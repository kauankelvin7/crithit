package br.com.crithit.api.rss;

import br.com.crithit.api.ai.DeterministicEditorialAiClient;
import br.com.crithit.api.ai.DeterministicEmbeddingClient;
import br.com.crithit.api.ai.EditorialAiClient;
import br.com.crithit.api.ai.EmbeddingClient;
import br.com.crithit.api.ai.LlmAdaptationService;
import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.ArticleSource;
import br.com.crithit.api.domain.entity.RssSource;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.repository.ArticleSourceRepository;
import br.com.crithit.api.repository.EditorialAuditLogRepository;
import br.com.crithit.api.repository.RssSourceRepository;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.UrlSecurityValidator;
import br.com.crithit.api.service.EditorialNotificationService;
import br.com.crithit.api.service.SlugService;
import com.rometools.rome.feed.synd.SyndContentImpl;
import com.rometools.rome.feed.synd.SyndEntryImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RssIngestionServiceTest {

    @Mock
    private RssSourceRepository rssSourceRepository;
    @Mock
    private ArticleRepository articleRepository;
    @Mock
    private ArticleSourceRepository articleSourceRepository;
    @Mock
    private EditorialAuditLogRepository auditLogRepository;
    @Mock
    private RssFeedFetcher feedFetcher;
    @Mock
    private CoverImageExtractor coverImageExtractor;
    @Mock
    private EditorialAiClient failingOrCustomAiClient;
    @Mock
    private EditorialNotificationService notificationService;

    private AppProperties properties;
    private RssSource animeSource;

    @BeforeEach
    void setUp() {
        properties = new AppProperties(
                new AppProperties.CorsProperties(List.of("http://localhost:3000")),
                new AppProperties.SecurityProperties(
                        new AppProperties.SecurityProperties.JwtProperties("0123456789abcdef0123456789abcdef", "crithit", 900, 604800),
                        "salt",
                        false
                ),
                new AppProperties.AdminSeedProperties("", "", "Editor"),
                new AppProperties.AiProperties("", "https://api.openai.com/v1", "gpt-4o-mini", "text-embedding-3-small", 1536, 5000, 1),
                new AppProperties.RssProperties(false, "0 */15 * * * *", 4, 2000, 2000, 1024 * 1024, 0.82, 72, 5, 15, "CritHitBot"),
                new AppProperties.RevalidateProperties("http://localhost:3000/api/revalidate", "sec", false),
                new AppProperties.NotificationProperties("", "", "", "http://localhost:3000")
        );
        animeSource = new RssSource();
        animeSource.setId(UUID.randomUUID());
        animeSource.setName("Anime News Network");
        animeSource.setFeedUrl("https://www.animenewsnetwork.com/all/rss.xml");
        animeSource.setSiteUrl("https://www.animenewsnetwork.com");
        animeSource.setLanguage("en");
        animeSource.setDefaultCategory(Category.ANIMES);
    }

    @Test
    void deduplicatesExactCanonicalUrlBeforeEmbedding() {
        RssIngestionService service = buildService(deterministicAiClient(), new DeterministicEmbeddingClient(properties));
        SyndEntryImpl entry = entry("https://www.animenewsnetwork.com/news/1?utm_source=rss", "Título Anime", "Resumo");

        when(articleRepository.existsByCanonicalUrlHash(any())).thenReturn(true);

        RssIngestionService.IngestionResult result = service.processFeedEntry(animeSource, entry, false);

        assertThat(result).isEqualTo(RssIngestionService.IngestionResult.DUPLICATE_EXACT_URL);
        verify(articleRepository, never()).save(any());
    }

    @Test
    void attachesMatchedSourceWhenPgVectorMatchAbove082OnActiveArticle() {
        RssIngestionService service = buildService(deterministicAiClient(), new DeterministicEmbeddingClient(properties));
        SyndEntryImpl entry = entry("https://www.animenewsnetwork.com/news/2026-11/frieren", "Frieren Temporada 2", "Novo trailer divulgado");

        UUID clusterId = UUID.randomUUID();
        Article existing = new Article();
        existing.setId(clusterId);
        existing.setStatus(ArticleStatus.PENDING_REVIEW);

        ArticleRepository.SemanticMatchProjection match = new ArticleRepository.SemanticMatchProjection() {
            @Override public UUID getArticleId() { return clusterId; }
            @Override public String getStatus() { return "PENDING_REVIEW"; }
            @Override public String getHeadline() { return "Frieren ganha trailer"; }
            @Override public double getSimilarityScore() { return 0.89; }
        };

        when(articleRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleSourceRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleRepository.findBestSemanticMatch(any(), any(), eq(0.82))).thenReturn(Optional.of(match));
        when(articleRepository.findById(clusterId)).thenReturn(Optional.of(existing));

        RssIngestionService.IngestionResult result = service.processFeedEntry(animeSource, entry, false);

        assertThat(result).isEqualTo(RssIngestionService.IngestionResult.MATCHED_EXISTING_CLUSTER);
        verify(articleSourceRepository).save(any(ArticleSource.class));
        verify(articleRepository, never()).save(any());
    }

    @Test
    void skipsEntryWhenPgVectorMatchesDiscardedArticleAt082() {
        RssIngestionService service = buildService(deterministicAiClient(), new DeterministicEmbeddingClient(properties));
        SyndEntryImpl entry = entry("https://www.animenewsnetwork.com/news/2026-11/discarded", "Rumor descartado", "Detalhes");

        ArticleRepository.SemanticMatchProjection match = new ArticleRepository.SemanticMatchProjection() {
            @Override public UUID getArticleId() { return UUID.randomUUID(); }
            @Override public String getStatus() { return "DISCARDED"; }
            @Override public String getHeadline() { return "Rumor antigo"; }
            @Override public double getSimilarityScore() { return 0.85; }
        };

        when(articleRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleSourceRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleRepository.findBestSemanticMatch(any(), any(), eq(0.82))).thenReturn(Optional.of(match));

        RssIngestionService.IngestionResult result = service.processFeedEntry(animeSource, entry, false);

        assertThat(result).isEqualTo(RssIngestionService.IngestionResult.DISCARDED_CLUSTER_MATCH);
        verify(articleRepository, never()).save(any());
    }

    @Test
    void persistsNewPendingReviewWithAnimesCategoryAndCuradoriaAttribution() {
        RssIngestionService service = buildService(deterministicAiClient(), new DeterministicEmbeddingClient(properties));
        SyndEntryImpl entry = entry("https://www.animenewsnetwork.com/news/2026-11/dandadan", "Dandadan Novo Arco", "Estúdio divulga pôster inédito");

        when(articleRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleSourceRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleRepository.findBestSemanticMatch(any(), any(), anyDouble())).thenReturn(Optional.empty());
        when(coverImageExtractor.extractValidCoverUrl(any(), any(), eq(false))).thenReturn("https://cdn.ann.com/dandadan.jpg");
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> {
            Article a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        RssIngestionService.IngestionResult result = service.processFeedEntry(animeSource, entry, false);

        assertThat(result).isEqualTo(RssIngestionService.IngestionResult.CREATED_PENDING_REVIEW);
        ArgumentCaptor<Article> captor = ArgumentCaptor.forClass(Article.class);
        verify(articleRepository).save(captor.capture());
        Article saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(ArticleStatus.PENDING_REVIEW);
        assertThat(saved.getAiStatus()).isEqualTo(AiStatus.SUCCESS);
        assertThat(saved.getCategory()).isEqualTo(Category.ANIMES);
        assertThat(saved.getContentType()).isEqualTo(ContentType.CURADORIA);
        assertThat(saved.getSourceName()).isEqualTo("Anime News Network");
        assertThat(saved.getSourceUrl()).isEqualTo("https://www.animenewsnetwork.com/news/2026-11/dandadan");
        assertThat(saved.getCoverImageUrl()).isEqualTo("https://cdn.ann.com/dandadan.jpg");
        verify(notificationService).notifyNewPendingArticleAsync(any());
    }

    @Test
    void persistsFallbackRawWhenAiClientThrows() {
        when(failingOrCustomAiClient.adaptArticle(any())).thenThrow(new RuntimeException("LLM offline"));
        RssIngestionService service = buildService(failingOrCustomAiClient, new DeterministicEmbeddingClient(properties));
        SyndEntryImpl entry = entry("https://www.animenewsnetwork.com/news/2026-11/fallback", "Anime Original Anunciado", "Equipe técnica confirmada");

        when(articleRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleSourceRepository.existsByCanonicalUrlHash(any())).thenReturn(false);
        when(articleRepository.findBestSemanticMatch(any(), any(), anyDouble())).thenReturn(Optional.empty());
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> {
            Article a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        RssIngestionService.IngestionResult result = service.processFeedEntry(animeSource, entry, false);

        assertThat(result).isEqualTo(RssIngestionService.IngestionResult.CREATED_FALLBACK_RAW);
        ArgumentCaptor<Article> captor = ArgumentCaptor.forClass(Article.class);
        verify(articleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ArticleStatus.PENDING_REVIEW);
        assertThat(captor.getValue().getAiStatus()).isEqualTo(AiStatus.FALLBACK_RAW);
    }

    private EditorialAiClient deterministicAiClient() {
        return new DeterministicEditorialAiClient(new HtmlSanitizer(), new SlugService(articleRepository));
    }

    private RssIngestionService buildService(EditorialAiClient aiClient, EmbeddingClient embeddingClient) {
        HtmlSanitizer sanitizer = new HtmlSanitizer();
        SlugService slugService = new SlugService(articleRepository);
        LlmAdaptationService llmService = new LlmAdaptationService(aiClient, sanitizer, slugService, properties);
        TransactionTemplate txTemplate = new TransactionTemplate() {
            @Override
            public <T> T execute(TransactionCallback<T> action) {
                return action.doInTransaction(new SimpleTransactionStatus());
            }
        };
        lenient().when(articleRepository.existsBySlug(any())).thenReturn(false);

        return new RssIngestionService(
                rssSourceRepository,
                articleRepository,
                articleSourceRepository,
                auditLogRepository,
                feedFetcher,
                coverImageExtractor,
                new UrlNormalizer(),
                new UrlSecurityValidator(),
                sanitizer,
                embeddingClient,
                llmService,
                slugService,
                txTemplate,
                Executors.newVirtualThreadPerTaskExecutor(),
                properties,
                notificationService
        );
    }

    private SyndEntryImpl entry(String link, String title, String descText) {
        SyndEntryImpl entry = new SyndEntryImpl();
        entry.setLink(link);
        entry.setTitle(title);
        SyndContentImpl desc = new SyndContentImpl();
        desc.setValue(descText);
        entry.setDescription(desc);
        return entry;
    }
}
