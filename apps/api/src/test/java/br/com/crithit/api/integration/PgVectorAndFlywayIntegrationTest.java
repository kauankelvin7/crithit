package br.com.crithit.api.integration;

import br.com.crithit.api.ai.EmbeddingClient;
import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.domain.type.PgVectorUserType;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.repository.RssSourceRepository;
import br.com.crithit.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class PgVectorAndFlywayIntegrationTest {

    private static final DockerImageName PGVECTOR_IMAGE =
            DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>(PGVECTOR_IMAGE)
            .withDatabaseName("crithit_test")
            .withUsername("crithit")
            .withPassword("crithit_test_pass");

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("crithit.rss.enabled", () -> "false");
        registry.add("crithit.revalidate.enabled", () -> "false");
        registry.add("crithit.admin-seed.email", () -> "admin-it@crithit.com.br");
        registry.add("crithit.admin-seed.password", () -> "TestAdminPass!2026");
    }

    @Autowired
    private RssSourceRepository rssSourceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private EmbeddingClient embeddingClient;

    @Test
    void flywaySeedsRssSourcesIncludingAnimesAndAdminSeedRunnerCreatesAdmin() {
        assertThat(rssSourceRepository.findByActiveTrueOrderByNameAsc())
                .isNotEmpty()
                .anyMatch(s -> s.getDefaultCategory() == Category.ANIMES && s.getName().contains("Anime News Network"));

        assertThat(userRepository.existsByEmailIgnoreCase("admin-it@crithit.com.br")).isTrue();
    }

    @Test
    void pgVectorCosineSimilarityQueryMatchesAboveThreshold082() {
        float[] vec = embeddingClient.generateEmbedding("Nintendo Switch 2 novo Mario Kart trailer");

        Article article = new Article();
        article.setSlug("pgvector-test-mario-kart");
        article.setStatus(ArticleStatus.PENDING_REVIEW);
        article.setAiStatus(AiStatus.SUCCESS);
        article.setCategory(Category.GAMES);
        article.setEditorialFormat(EditorialFormat.NEWS);
        article.setContentType(ContentType.CURADORIA);
        article.setAuthorName("Redação CritHit!");
        article.setSourceName("Gematsu");
        article.setSourceUrl("https://www.gematsu.com/2026/11/mario-kart");
        article.setHeadline("Novo Mario Kart ganha trailer de gameplay");
        article.setSubheadlineBullets(List.of("Destaque 1"));
        article.setLead("Lead completo editorial sobre o novo jogo de corrida da Nintendo.");
        article.setBodyParagraphs(List.of("Parágrafo completo para teste pgvector."));
        article.setReelsSummary("Resumo Reels para teste pgvector.");
        article.setTags(List.of("games"));
        article.setCoverArtKey(Category.GAMES.defaultCoverArtKey());
        article.setEmbedding(vec);

        articleRepository.saveAndFlush(article);

        Instant cutoff = Instant.now().minus(72, ChronoUnit.HOURS);
        Optional<ArticleRepository.SemanticMatchProjection> exactMatch = articleRepository.findBestSemanticMatch(
                PgVectorUserType.toVectorLiteral(vec), cutoff, 0.82);

        assertThat(exactMatch).isPresent();
        assertThat(exactMatch.get().getSimilarityScore()).isGreaterThanOrEqualTo(0.82);

        float[] unrelated = embeddingClient.generateEmbedding("Critica de cinema independente europeu festival de Berlim");
        Optional<ArticleRepository.SemanticMatchProjection> unrelatedMatch = articleRepository.findBestSemanticMatch(
                PgVectorUserType.toVectorLiteral(unrelated), cutoff, 0.82);

        assertThat(unrelatedMatch).isEmpty();
    }
}
