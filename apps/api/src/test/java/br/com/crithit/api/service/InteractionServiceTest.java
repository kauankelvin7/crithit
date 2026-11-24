package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.ArticleComment;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.InteractionType;
import br.com.crithit.api.repository.ArticleCommentRepository;
import br.com.crithit.api.repository.ArticleInteractionRepository;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.RateLimitService;
import br.com.crithit.api.web.dto.CommentDto;
import br.com.crithit.api.web.dto.CreateCommentRequest;
import br.com.crithit.api.web.dto.LikeToggleResponse;
import br.com.crithit.api.web.dto.SaveToggleResponse;
import br.com.crithit.api.web.dto.ViewResponse;
import br.com.crithit.api.web.exception.BusinessValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InteractionServiceTest {

    @Mock
    private ArticleRepository articleRepository;
    @Mock
    private ArticleInteractionRepository interactionRepository;
    @Mock
    private ArticleCommentRepository commentRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private RateLimitService rateLimitService;
    @Mock
    private ArticleCacheService cacheService;

    private InteractionService interactionService;
    private UUID articleId;
    private Article publishedArticle;

    @BeforeEach
    void setUp() {
        interactionService = new InteractionService(
                articleRepository,
                interactionRepository,
                commentRepository,
                redisTemplate,
                rateLimitService,
                new HtmlSanitizer(),
                cacheService
        );
        articleId = UUID.randomUUID();
        publishedArticle = new Article();
        publishedArticle.setId(articleId);
        publishedArticle.setSlug("capcom-confirma-remake-dino-crisis");
        publishedArticle.setStatus(ArticleStatus.PUBLISHED);
        publishedArticle.setViewsCount(100L);
        publishedArticle.setLikesCount(0L);
        publishedArticle.setSavesCount(0L);

        when(rateLimitService.tryConsume(anyString(), anyString(), anyInt(), any(Duration.class))).thenReturn(true);
        when(articleRepository.findByIdAndStatus(articleId, ArticleStatus.PUBLISHED))
                .thenReturn(Optional.of(publishedArticle));
    }

    @Test
    void deveExecutarToggleIdempotenteEmLikeESaveGarantindoContadoresNuncaNegativos() {
        String visitorHash = "visitor-hash-01";
        String ipHash = "ip-hash-01";

        // 1º clique em LIKE: adiciona curtida (0 -> 1)
        when(interactionRepository.deleteInteraction(articleId, visitorHash, InteractionType.LIKE)).thenReturn(0);
        LikeToggleResponse likeAdded = interactionService.toggleLike(articleId, visitorHash, ipHash);
        assertThat(likeAdded.liked()).isTrue();
        assertThat(likeAdded.likesCount()).isEqualTo(1L);

        // 2º clique em LIKE (com contador no banco em 0): remove curtida e aplica piso 0 (nunca negativo)
        when(interactionRepository.deleteInteraction(articleId, visitorHash, InteractionType.LIKE)).thenReturn(1);
        LikeToggleResponse likeRemoved = interactionService.toggleLike(articleId, visitorHash, ipHash);
        assertThat(likeRemoved.liked()).isFalse();
        assertThat(likeRemoved.likesCount()).isZero();

        // 1º clique em SAVE: adiciona salvamento (0 -> 1)
        when(interactionRepository.deleteInteraction(articleId, visitorHash, InteractionType.SAVE)).thenReturn(0);
        SaveToggleResponse saveAdded = interactionService.toggleSave(articleId, visitorHash, ipHash);
        assertThat(saveAdded.saved()).isTrue();
        assertThat(saveAdded.savesCount()).isEqualTo(1L);

        // 2º clique em SAVE (com contador em 0): remove salvamento sem permitir valor negativo
        when(interactionRepository.deleteInteraction(articleId, visitorHash, InteractionType.SAVE)).thenReturn(1);
        SaveToggleResponse saveRemoved = interactionService.toggleSave(articleId, visitorHash, ipHash);
        assertThat(saveRemoved.saved()).isFalse();
        assertThat(saveRemoved.savesCount()).isZero();
    }

    @Test
    void deveRespeitarJanelaDeDeduplicacaoDe6HorasNoRedisParaView() {
        String visitorHash = "visitor-dedup-6h";
        String ipHash = "ip-hash-01";
        String expectedKey = "crithit:view:" + articleId + ":" + visitorHash;

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofHours(6))))
                .thenReturn(true)
                .thenReturn(false);

        ViewResponse firstView = interactionService.registerView(articleId, visitorHash, ipHash);
        ViewResponse duplicateView = interactionService.registerView(articleId, visitorHash, ipHash);

        assertThat(firstView.counted()).isTrue();
        assertThat(firstView.viewsCount()).isEqualTo(101L);
        assertThat(duplicateView.counted()).isFalse();
        assertThat(duplicateView.viewsCount()).isEqualTo(100L);
        verify(articleRepository, times(1)).incrementViewsCount(articleId);
    }

    @Test
    void deveSanitizarNomeECorpoAoCriarComentarioERejeitarPayloadQueFiqueVazioAposLimpezaDeHtml() {
        String visitorHash = "visitor-comment";
        String ipHash = "ip-comment";

        when(commentRepository.save(any(ArticleComment.class))).thenAnswer(inv -> {
            ArticleComment c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            c.setCreatedAt(Instant.now());
            return c;
        });

        CreateCommentRequest dirtyRequest = new CreateCommentRequest(
                "<b>Lucas</b><script>alert(1)</script>",
                "<img src=x onerror=alert(1)>Excelente cobertura do remake!"
        );

        CommentDto created = interactionService.createComment(articleId, dirtyRequest, visitorHash, ipHash);

        assertThat(created.authorDisplayName()).isEqualTo("Lucas");
        assertThat(created.body()).isEqualTo("Excelente cobertura do remake!");
        verify(articleRepository).incrementCommentsCount(articleId);

        CreateCommentRequest emptyAfterSanitization = new CreateCommentRequest(
                "Lucas",
                "<script>alert('xss')</script><iframe src='https://evil.test'></iframe>"
        );

        assertThatThrownBy(() -> interactionService.createComment(
                articleId, emptyAfterSanitization, visitorHash, ipHash))
                .isInstanceOf(BusinessValidationException.class)
                .hasMessageContaining("Comentário inválido ou vazio após remoção de HTML");
        verify(commentRepository, times(1)).save(any());
    }
}
