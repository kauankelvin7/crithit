package br.com.crithit.api.service;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.repository.ArticleSourceRepository;
import br.com.crithit.api.repository.EditorialAuditLogRepository;
import br.com.crithit.api.repository.UserRepository;
import br.com.crithit.api.rss.RssIngestionService;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.UrlSecurityValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduledArticlePublisherTest {

    @Mock
    private ArticleRepository articleRepository;
    @Mock
    private ArticleSourceRepository articleSourceRepository;
    @Mock
    private EditorialAuditLogRepository auditLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RevalidationService revalidationService;
    @Mock
    private RssIngestionService rssIngestionService;

    private AdminArticleService adminArticleService;
    private ScheduledArticlePublisher scheduledArticlePublisher;

    @BeforeEach
    void setUp() {
        adminArticleService = new AdminArticleService(
                articleRepository,
                articleSourceRepository,
                auditLogRepository,
                userRepository,
                new HtmlSanitizer(),
                new UrlSecurityValidator(),
                new SlugService(articleRepository),
                new ArticleMapper(),
                revalidationService
        );
        AppProperties props = new AppProperties(
                null,
                null,
                null,
                null,
                new AppProperties.RssProperties(true, "0 */15 * * * *", 4, 3000, 5000, 1048576, 0.82, 72, 3, 15, "CritHitBot/1.0"),
                null,
                null
        );
        scheduledArticlePublisher = new ScheduledArticlePublisher(adminArticleService, rssIngestionService, props);
    }

    @Test
    void devePromoverAutomaticamenteArtigosAgendadosVencidosParaPublishedDisparandoCacheERevalidacaoIsr() {
        Article dueArticle = buildScheduledArticle(
                "gta-6-ganha-novo-trailer-oficial",
                Instant.now().minus(5, ChronoUnit.MINUTES),
                "Rafael Mendes",
                "https://www.rockstargames.com/newswire"
        );

        when(articleRepository.findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
                eq(ArticleStatus.SCHEDULED), any(Instant.class)))
                .thenReturn(List.of(dueArticle));
        when(articleRepository.save(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduledArticlePublisher.publishScheduledArticles();

        assertThat(dueArticle.getStatus()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(dueArticle.getScheduledAt()).isNull();
        assertThat(dueArticle.getPublishedAt()).isNotNull();
        verify(articleRepository).save(dueArticle);
        verify(auditLogRepository).save(any());
        verify(revalidationService).invalidateNowAndNotifyAsync("ARTICLE_PUBLISHED", "gta-6-ganha-novo-trailer-oficial");
    }

    @Test
    void deveManterIntactosArtigosAgendadosComScheduledAtNoFuturo() {
        Instant futureTime = Instant.now().plus(2, ChronoUnit.HOURS);
        Article futureArticle = buildScheduledArticle(
                "review-embargado-para-amanha",
                futureTime,
                "Marina Costa",
                "https://www.ign.com/articles/embargoed-review"
        );

        when(articleRepository.findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
                eq(ArticleStatus.SCHEDULED), any(Instant.class)))
                .thenReturn(List.of(futureArticle));

        scheduledArticlePublisher.publishScheduledArticles();

        assertThat(futureArticle.getStatus()).isEqualTo(ArticleStatus.SCHEDULED);
        assertThat(futureArticle.getScheduledAt()).isEqualTo(futureTime);
        assertThat(futureArticle.getPublishedAt()).isNull();
        verify(articleRepository, never()).save(any());
        verify(revalidationService, never()).invalidateNowAndNotifyAsync(any(), any());
    }

    @Test
    void deveBloquearPublicacaoERegistrarErroSeArtigoAgendadoViolarAtribuicaoObrigatoria() {
        Article invalidUrlArticle = buildScheduledArticle(
                "pauta-agendada-com-url-invalida",
                Instant.now().minus(2, ChronoUnit.MINUTES),
                "Rafael Mendes",
                "javascript:alert(1)"
        );
        Article emptyAuthorArticle = buildScheduledArticle(
                "pauta-agendada-sem-autor",
                Instant.now().minus(1, ChronoUnit.MINUTES),
                " ",
                "https://www.gematsu.com/tag/capcom"
        );

        when(articleRepository.findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
                eq(ArticleStatus.SCHEDULED), any(Instant.class)))
                .thenReturn(List.of(invalidUrlArticle, emptyAuthorArticle));

        scheduledArticlePublisher.publishScheduledArticles();

        assertThat(invalidUrlArticle.getStatus()).isEqualTo(ArticleStatus.SCHEDULED);
        assertThat(emptyAuthorArticle.getStatus()).isEqualTo(ArticleStatus.SCHEDULED);
        verify(articleRepository, never()).save(any());
        verify(revalidationService, never()).invalidateNowAndNotifyAsync(any(), any());
    }

    private Article buildScheduledArticle(String slug, Instant scheduledAt, String authorName, String sourceUrl) {
        Article a = new Article();
        a.setId(UUID.randomUUID());
        a.setSlug(slug);
        a.setStatus(ArticleStatus.SCHEDULED);
        a.setScheduledAt(scheduledAt);
        a.setAiStatus(AiStatus.SUCCESS);
        a.setCategory(Category.GAMES);
        a.setEditorialFormat(EditorialFormat.NEWS);
        a.setContentType(ContentType.CURADORIA);
        a.setAuthorName(authorName);
        a.setSourceName("Gematsu");
        a.setSourceUrl(sourceUrl);
        a.setHeadline("Manchete agendada com tamanho válido para publicação");
        a.setLead("Lead editorial completo e validado para publicação automática pelo agendador.");
        a.setBodyParagraphs(List.of("Primeiro parágrafo completo com informações verificadas pela redação."));
        a.setReelsSummary("Resumo 9:16 validado para o player vertical do portal CritHit.");
        a.setCoverArtKey(Category.GAMES.defaultCoverArtKey());
        return a;
    }
}
