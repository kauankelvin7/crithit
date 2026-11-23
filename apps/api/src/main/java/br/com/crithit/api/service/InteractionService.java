package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.ArticleComment;
import br.com.crithit.api.domain.entity.ArticleInteraction;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.CommentStatus;
import br.com.crithit.api.domain.enums.InteractionType;
import br.com.crithit.api.repository.ArticleCommentRepository;
import br.com.crithit.api.repository.ArticleInteractionRepository;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.RateLimitService;
import br.com.crithit.api.web.dto.CommentDto;
import br.com.crithit.api.web.dto.CommentPage;
import br.com.crithit.api.web.dto.CreateCommentRequest;
import br.com.crithit.api.web.dto.LikeToggleResponse;
import br.com.crithit.api.web.dto.SaveToggleResponse;
import br.com.crithit.api.web.dto.ViewResponse;
import br.com.crithit.api.web.exception.BusinessValidationException;
import br.com.crithit.api.web.exception.RateLimitExceededException;
import br.com.crithit.api.web.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
public class InteractionService {

    private static final Logger log = LoggerFactory.getLogger(InteractionService.class);
    private static final Duration VIEW_DEDUP_TTL = Duration.ofHours(6);

    private final ArticleRepository articleRepository;
    private final ArticleInteractionRepository interactionRepository;
    private final ArticleCommentRepository commentRepository;
    private final StringRedisTemplate redisTemplate;
    private final RateLimitService rateLimitService;
    private final HtmlSanitizer htmlSanitizer;
    private final ArticleCacheService cacheService;

    public InteractionService(
            ArticleRepository articleRepository,
            ArticleInteractionRepository interactionRepository,
            ArticleCommentRepository commentRepository,
            StringRedisTemplate redisTemplate,
            RateLimitService rateLimitService,
            HtmlSanitizer htmlSanitizer,
            ArticleCacheService cacheService
    ) {
        this.articleRepository = articleRepository;
        this.interactionRepository = interactionRepository;
        this.commentRepository = commentRepository;
        this.redisTemplate = redisTemplate;
        this.rateLimitService = rateLimitService;
        this.htmlSanitizer = htmlSanitizer;
        this.cacheService = cacheService;
    }

    @Transactional
    public ViewResponse registerView(UUID articleId, String visitorHash, String ipHash) {
        if (!rateLimitService.tryConsume("view", visitorHash + ":" + ipHash, 30, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Muitas solicitações de visualização em curto período");
        }
        Article article = requirePublished(articleId);

        String dedupKey = "crithit:view:" + articleId + ":" + visitorHash;
        boolean counted = false;
        try {
            Boolean set = redisTemplate.opsForValue().setIfAbsent(dedupKey, "1", VIEW_DEDUP_TTL);
            counted = Boolean.TRUE.equals(set);
        } catch (Exception ex) {
            log.debug("Redis unavailable during view dedup; counting view once: {}", ex.getMessage());
            counted = true;
        }

        if (counted) {
            ArticleInteraction view = new ArticleInteraction();
            view.setArticle(article);
            view.setVisitorHash(visitorHash);
            view.setInteractionType(InteractionType.VIEW);
            interactionRepository.save(view);
            articleRepository.incrementViewsCount(articleId);
            cacheService.evictEditorialCaches(article.getSlug());
            return new ViewResponse(articleId, article.getViewsCount() + 1, true);
        }

        return new ViewResponse(articleId, article.getViewsCount(), false);
    }

    @Transactional
    public LikeToggleResponse toggleLike(UUID articleId, String visitorHash, String ipHash) {
        if (!rateLimitService.tryConsume("like", visitorHash + ":" + ipHash, 30, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Limite de curtidas por minuto atingido");
        }
        Article article = requirePublished(articleId);

        int deleted = interactionRepository.deleteInteraction(articleId, visitorHash, InteractionType.LIKE);
        boolean liked;
        long updatedCount;
        if (deleted > 0) {
            articleRepository.decrementLikesCount(articleId);
            liked = false;
            updatedCount = Math.max(0L, article.getLikesCount() - 1);
        } else {
            ArticleInteraction like = new ArticleInteraction();
            like.setArticle(article);
            like.setVisitorHash(visitorHash);
            like.setInteractionType(InteractionType.LIKE);
            interactionRepository.save(like);
            articleRepository.incrementLikesCount(articleId);
            liked = true;
            updatedCount = article.getLikesCount() + 1;
        }
        cacheService.evictEditorialCaches(article.getSlug());
        return new LikeToggleResponse(articleId, liked, updatedCount);
    }

    @Transactional
    public SaveToggleResponse toggleSave(UUID articleId, String visitorHash, String ipHash) {
        if (!rateLimitService.tryConsume("save", visitorHash + ":" + ipHash, 30, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Limite de salvamentos por minuto atingido");
        }
        Article article = requirePublished(articleId);

        int deleted = interactionRepository.deleteInteraction(articleId, visitorHash, InteractionType.SAVE);
        boolean saved;
        long updatedCount;
        if (deleted > 0) {
            articleRepository.decrementSavesCount(articleId);
            saved = false;
            updatedCount = Math.max(0L, article.getSavesCount() - 1);
        } else {
            ArticleInteraction save = new ArticleInteraction();
            save.setArticle(article);
            save.setVisitorHash(visitorHash);
            save.setInteractionType(InteractionType.SAVE);
            interactionRepository.save(save);
            articleRepository.incrementSavesCount(articleId);
            saved = true;
            updatedCount = article.getSavesCount() + 1;
        }
        cacheService.evictEditorialCaches(article.getSlug());
        return new SaveToggleResponse(articleId, saved, updatedCount);
    }

    @Transactional(readOnly = true)
    public CommentPage listComments(UUID articleId, int page, int size) {
        requirePublished(articleId);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(50, Math.max(1, size));

        Page<ArticleComment> comments = commentRepository.findByArticleIdAndStatusOrderByCreatedAtDesc(
                articleId, CommentStatus.VISIBLE, PageRequest.of(safePage, safeSize));

        return new CommentPage(
                comments.getContent().stream().map(this::toCommentDto).toList(),
                comments.getNumber(),
                comments.getSize(),
                comments.getTotalElements(),
                comments.getTotalPages()
        );
    }

    @Transactional
    public CommentDto createComment(UUID articleId, CreateCommentRequest request, String visitorHash, String ipHash) {
        if (!rateLimitService.tryConsume("comment", visitorHash + ":" + ipHash, 5, Duration.ofMinutes(10))) {
            throw new RateLimitExceededException("Limite de 5 comentários a cada 10 minutos excedido");
        }
        Article article = requirePublished(articleId);

        String cleanAuthor = htmlSanitizer.stripAllHtml(request.authorDisplayName());
        String cleanBody = htmlSanitizer.stripAllHtml(request.body());

        if (cleanAuthor == null || cleanAuthor.length() < 2 || cleanAuthor.length() > 60) {
            throw new BusinessValidationException("Nome do autor inválido após sanitização (2 a 60 caracteres)");
        }
        if (cleanBody == null || cleanBody.length() < 3 || cleanBody.length() > 1000) {
            throw new BusinessValidationException("Comentário inválido ou vazio após remoção de HTML (3 a 1000 caracteres)");
        }

        ArticleComment comment = new ArticleComment();
        comment.setArticle(article);
        comment.setVisitorHash(visitorHash);
        comment.setAuthorDisplayName(cleanAuthor);
        comment.setBody(cleanBody);
        comment.setStatus(CommentStatus.VISIBLE);

        ArticleComment saved = commentRepository.save(comment);
        articleRepository.incrementCommentsCount(articleId);
        cacheService.evictEditorialCaches(article.getSlug());
        return toCommentDto(saved);
    }

    private Article requirePublished(UUID articleId) {
        return articleRepository.findByIdAndStatus(articleId, ArticleStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Matéria publicada não encontrada: " + articleId));
    }

    private CommentDto toCommentDto(ArticleComment c) {
        return new CommentDto(
                c.getId(),
                c.getArticle().getId(),
                c.getAuthorDisplayName(),
                c.getBody(),
                c.getCreatedAt()
        );
    }
}
