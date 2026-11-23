package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.User;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.repository.ArticleSourceRepository;
import br.com.crithit.api.repository.EditorialAuditLogRepository;
import br.com.crithit.api.repository.UserRepository;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.UrlSecurityValidator;
import br.com.crithit.api.web.dto.AdminApproveRequest;
import br.com.crithit.api.web.dto.AdminArticleDetail;
import br.com.crithit.api.web.dto.AdminArticleUpsertRequest;
import br.com.crithit.api.web.dto.PublicArticleDetail;
import br.com.crithit.api.web.dto.ReasonRequest;
import br.com.crithit.api.web.dto.ScheduleArticleRequest;
import br.com.crithit.api.web.exception.BusinessValidationException;
import br.com.crithit.api.web.exception.InvalidStateTransitionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminArticleServiceTest {

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

    private ArticleMapper mapper;
    private AdminArticleService service;
    private UUID editorId;
    private User editor;

    @BeforeEach
    void setUp() {
        mapper = new ArticleMapper();
        service = new AdminArticleService(
                articleRepository,
                articleSourceRepository,
                auditLogRepository,
                userRepository,
                new HtmlSanitizer(),
                new UrlSecurityValidator(),
                new SlugService(articleRepository),
                mapper,
                revalidationService
        );
        editorId = UUID.randomUUID();
        editor = new User();
        editor.setId(editorId);
        editor.setEmail("editor@crithit.com.br");
        editor.setDisplayName("Editor-Chefe");
    }

    @Test
    void approvesPendingArticleAndPromotesMainHeadlineAtomically() {
        UUID articleId = UUID.randomUUID();
        Article pending = sampleArticle(articleId, ArticleStatus.PENDING_REVIEW, ContentType.CURADORIA);

        when(articleRepository.findById(articleId)).thenReturn(Optional.of(pending));
        when(userRepository.findById(editorId)).thenReturn(Optional.of(editor));
        when(articleRepository.saveAndFlush(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));
        when(articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(articleId)).thenReturn(List.of());

        AdminArticleDetail result = service.approveAndPublish(
                articleId, new AdminApproveRequest(true, null), editorId);

        assertThat(result.status()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(result.isMainHeadline()).isTrue();
        assertThat(result.publishedAt()).isNotNull();
        verify(articleRepository).clearOtherMainHeadlines(articleId);
        verify(articleRepository).promoteMainHeadline(articleId);
        verify(revalidationService).invalidateNowAndNotifyAsync("ARTICLE_PUBLISHED", pending.getSlug());
    }

    @Test
    void unpublishesMainHeadlinePreservingMetricsAndPromotingFallback() {
        UUID mainId = UUID.randomUUID();
        UUID fallbackId = UUID.randomUUID();
        Article publishedMain = sampleArticle(mainId, ArticleStatus.PUBLISHED, ContentType.CURADORIA);
        publishedMain.setMainHeadline(true);
        publishedMain.setViewsCount(4200L);
        publishedMain.setLikesCount(310L);
        publishedMain.setSavesCount(95L);
        publishedMain.setCommentsCount(18L);
        Instant originalPublishedAt = Instant.now().minus(2, ChronoUnit.HOURS);
        publishedMain.setPublishedAt(originalPublishedAt);

        Article fallback = sampleArticle(fallbackId, ArticleStatus.PUBLISHED, ContentType.AUTORAL);
        fallback.setMainHeadline(false);

        when(articleRepository.findById(mainId)).thenReturn(Optional.of(publishedMain));
        when(userRepository.findById(editorId)).thenReturn(Optional.of(editor));
        when(articleRepository.saveAndFlush(any(Article.class))).thenAnswer(inv -> inv.getArgument(0));
        when(articleRepository.findTopByStatusAndIdNotOrderByPublishedAtDescCreatedAtDesc(
                ArticleStatus.PUBLISHED, mainId)).thenReturn(Optional.of(fallback));
        when(articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(mainId)).thenReturn(List.of());

        AdminArticleDetail result = service.unpublishArticle(mainId, new ReasonRequest("Correção factual"), editorId);

        assertThat(result.status()).isEqualTo(ArticleStatus.UNPUBLISHED);
        assertThat(result.isMainHeadline()).isFalse();
        assertThat(result.unpublishedAt()).isNotNull();
        assertThat(result.viewsCount()).isEqualTo(4200L);
        assertThat(result.likesCount()).isEqualTo(310L);
        assertThat(result.savesCount()).isEqualTo(95L);
        assertThat(result.commentsCount()).isEqualTo(18L);
        assertThat(result.publishedAt()).isEqualTo(originalPublishedAt);
        assertThat(fallback.isMainHeadline()).isTrue();
        verify(articleRepository).save(fallback);
        verify(revalidationService).invalidateNowAndNotifyAsync("ARTICLE_UNPUBLISHED", publishedMain.getSlug());
    }

    @Test
    void blocksInvalidStateTransitionsAndPastSchedules() {
        UUID articleId = UUID.randomUUID();
        Article published = sampleArticle(articleId, ArticleStatus.PUBLISHED, ContentType.AUTORAL);

        when(articleRepository.findById(articleId)).thenReturn(Optional.of(published));

        assertThatThrownBy(() -> service.discardArticle(articleId, new ReasonRequest("x"), editorId))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThatThrownBy(() -> service.republishArticle(articleId, editorId))
                .isInstanceOf(InvalidStateTransitionException.class);

        Article pending = sampleArticle(articleId, ArticleStatus.PENDING_REVIEW, ContentType.CURADORIA);
        when(articleRepository.findById(articleId)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> service.unpublishArticle(articleId, null, editorId))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThatThrownBy(() -> service.setMainHeadline(articleId, editorId))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThatThrownBy(() -> service.scheduleArticle(
                articleId,
                new ScheduleArticleRequest(Instant.now().minus(5, ChronoUnit.MINUTES), null),
                editorId))
                .isInstanceOf(BusinessValidationException.class);
    }

    @Test
    void rejectsInvalidAttributionAndMaliciousJavascriptUrls() {
        AdminArticleUpsertRequest invalidSourceUrl = new AdminArticleUpsertRequest(
                null,
                "Novo trailer de anime sazonal ganha data",
                List.of("Estúdio confirma estreia simultânea"),
                "Lead jornalístico claro e direto sobre o lançamento do anime na próxima temporada.",
                List.of("Primeiro parágrafo detalhando a estreia e o estúdio responsável."),
                "Resumo curto para o formato vertical Reels sobre o anúncio do anime.",
                Category.ANIMES,
                EditorialFormat.NEWS,
                List.of("animes"),
                "https://cdn.example.com/capa.jpg",
                2,
                null,
                false,
                "Redação CritHit!",
                ContentType.CURADORIA,
                "Anime News Network",
                "javascript:alert(1)"
        );

        assertThatThrownBy(() -> service.createManualArticle(invalidSourceUrl, editorId))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("sourceUrl");

        AdminArticleUpsertRequest invalidCoverUrl = new AdminArticleUpsertRequest(
                null,
                "Novo trailer de anime sazonal ganha data",
                List.of("Estúdio confirma estreia simultânea"),
                "Lead jornalístico claro e direto sobre o lançamento do anime na próxima temporada.",
                List.of("Primeiro parágrafo detalhando a estreia e o estúdio responsável."),
                "Resumo curto para o formato vertical Reels sobre o anúncio do anime.",
                Category.ANIMES,
                EditorialFormat.NEWS,
                List.of("animes"),
                "javascript:alert(2)",
                2,
                null,
                false,
                "Redação CritHit!",
                ContentType.CURADORIA,
                "Anime News Network",
                "https://www.animenewsnetwork.com/news/123"
        );

        assertThatThrownBy(() -> service.createManualArticle(invalidCoverUrl, editorId))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("coverImageUrl");
    }

    @Test
    void rendersTransparencyNoteOnlyForCuradoriaArticles() {
        Article curadoria = sampleArticle(UUID.randomUUID(), ArticleStatus.PUBLISHED, ContentType.CURADORIA);
        Article autoral = sampleArticle(UUID.randomUUID(), ArticleStatus.PUBLISHED, ContentType.AUTORAL);

        PublicArticleDetail curadoriaDetail = mapper.toPublicDetail(curadoria, List.of(), List.of(), false, false);
        PublicArticleDetail autoralDetail = mapper.toPublicDetail(autoral, List.of(), List.of(), false, false);

        assertThat(curadoriaDetail.transparencyNote())
                .isNotBlank()
                .contains("apoio de ferramenta de IA")
                .contains(curadoria.getSourceName());
        assertThat(autoralDetail.transparencyNote()).isNull();
    }

    private Article sampleArticle(UUID id, ArticleStatus status, ContentType contentType) {
        Article a = new Article();
        a.setId(id);
        a.setSlug("materia-teste-" + id.toString().substring(0, 6));
        a.setStatus(status);
        a.setAiStatus(AiStatus.SUCCESS);
        a.setCategory(Category.GAMES);
        a.setEditorialFormat(EditorialFormat.NEWS);
        a.setContentType(contentType);
        a.setAuthorName("Redação CritHit!");
        a.setSourceName("IGN");
        a.setSourceUrl("https://www.ign.com/articles/sample");
        a.setHeadline("Título de teste editorial para CritHit!");
        a.setSubheadlineBullets(List.of("Ponto 1", "Ponto 2"));
        a.setLead("Lead completo e objetivo com mais de vinte caracteres para validação.");
        a.setBodyParagraphs(List.of("Parágrafo completo da notícia com contexto para o leitor."));
        a.setReelsSummary("Resumo curto para Reels com informações diretas ao ponto.");
        a.setTags(List.of("games", "crithit"));
        a.setCoverArtKey(Category.GAMES.defaultCoverArtKey());
        a.setReadingTimeMinutes(2);
        return a;
    }
}
