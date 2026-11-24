package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.ArticleSource;
import br.com.crithit.api.domain.entity.EditorialAuditLog;
import br.com.crithit.api.domain.entity.User;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.AuditAction;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.repository.ArticleSourceRepository;
import br.com.crithit.api.repository.EditorialAuditLogRepository;
import br.com.crithit.api.repository.UserRepository;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.UrlSecurityValidator;
import br.com.crithit.api.web.dto.AdminApproveRequest;
import br.com.crithit.api.web.dto.AdminArticleDetail;
import br.com.crithit.api.web.dto.AdminArticlePage;
import br.com.crithit.api.web.dto.AdminArticleSummary;
import br.com.crithit.api.web.dto.AdminArticleUpsertRequest;
import br.com.crithit.api.web.dto.ReasonRequest;
import br.com.crithit.api.web.dto.ScheduleArticleRequest;
import br.com.crithit.api.web.exception.BusinessValidationException;
import br.com.crithit.api.web.exception.InvalidStateTransitionException;
import br.com.crithit.api.web.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminArticleService {

    private static final Logger log = LoggerFactory.getLogger(AdminArticleService.class);

    private final ArticleRepository articleRepository;
    private final ArticleSourceRepository articleSourceRepository;
    private final EditorialAuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final HtmlSanitizer htmlSanitizer;
    private final UrlSecurityValidator urlSecurityValidator;
    private final SlugService slugService;
    private final ArticleMapper mapper;
    private final RevalidationService revalidationService;

    public AdminArticleService(
            ArticleRepository articleRepository,
            ArticleSourceRepository articleSourceRepository,
            EditorialAuditLogRepository auditLogRepository,
            UserRepository userRepository,
            HtmlSanitizer htmlSanitizer,
            UrlSecurityValidator urlSecurityValidator,
            SlugService slugService,
            ArticleMapper mapper,
            RevalidationService revalidationService
    ) {
        this.articleRepository = articleRepository;
        this.articleSourceRepository = articleSourceRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.htmlSanitizer = htmlSanitizer;
        this.urlSecurityValidator = urlSecurityValidator;
        this.slugService = slugService;
        this.mapper = mapper;
        this.revalidationService = revalidationService;
    }

    @Transactional(readOnly = true)
    public AdminArticlePage listArticles(
            ArticleStatus status,
            AiStatus aiStatus,
            Category category,
            String q,
            int page,
            int size
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(50, Math.max(1, size));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Order.desc("createdAt")));

        Specification<Article> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (aiStatus != null) {
                predicates.add(cb.equal(root.get("aiStatus"), aiStatus));
            }
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (StringUtils.hasText(q)) {
                String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("headline")), pattern),
                        cb.like(cb.lower(root.get("sourceName")), pattern),
                        cb.like(cb.lower(root.get("authorName")), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Page<Article> result = articleRepository.findAll(spec, pageable);
        List<UUID> ids = result.getContent().stream().map(Article::getId).toList();
        Map<UUID, Long> countsMap = new HashMap<>();
        if (!ids.isEmpty()) {
            for (ArticleSourceRepository.ArticleSourceCount row : articleSourceRepository.countByArticleIdIn(ids)) {
                countsMap.put(row.getArticleId(), row.getTotal());
            }
        }

        List<AdminArticleSummary> summaries = result.getContent().stream()
                .map(a -> mapper.toAdminSummary(a, countsMap.getOrDefault(a.getId(), 0L)))
                .toList();

        return new AdminArticlePage(
                summaries,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public AdminArticleDetail getArticle(UUID id) {
        Article article = requireArticle(id);
        List<ArticleSource> sources = articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id);
        return mapper.toAdminDetail(article, sources);
    }

    @Transactional
    public AdminArticleDetail createManualArticle(AdminArticleUpsertRequest request, UUID actorUserId) {
        User actor = resolveUser(actorUserId);
        Article article = new Article();
        article.setStatus(ArticleStatus.PENDING_REVIEW);
        article.setAiStatus(AiStatus.MANUAL);
        article.setReviewedBy(actor);
        article.setUpdatedBy(actor);

        applyUpsertFields(article, request, true);
        validateAttributionAndContent(article);

        Article saved = articleRepository.save(article);
        recordAudit(saved, actor, AuditAction.CREATED_MANUAL, null, ArticleStatus.PENDING_REVIEW.name(), Map.of());
        return mapper.toAdminDetail(saved, List.of());
    }

    @Transactional
    public AdminArticleDetail updateArticle(UUID id, AdminArticleUpsertRequest request, UUID actorUserId) {
        Article article = requireArticle(id);
        User actor = resolveUser(actorUserId);

        applyUpsertFields(article, request, false);
        validateAttributionAndContent(article);
        article.setUpdatedBy(actor);

        Article saved = articleRepository.save(article);
        recordAudit(saved, actor, AuditAction.EDITED, saved.getStatus().name(), saved.getStatus().name(), Map.of());

        if (saved.getStatus() == ArticleStatus.PUBLISHED) {
            revalidationService.invalidateNowAndNotifyAsync("ARTICLE_UPDATED", saved.getSlug());
        }
        return mapper.toAdminDetail(saved, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public AdminArticleDetail approveAndPublish(UUID id, AdminApproveRequest request, UUID actorUserId) {
        Article article = requireArticle(id);
        ArticleStatus fromStatus = article.getStatus();
        if (fromStatus != ArticleStatus.PENDING_REVIEW && fromStatus != ArticleStatus.SCHEDULED) {
            throw new InvalidStateTransitionException(
                    "Não é possível aprovar/publicar artigo em estado " + fromStatus);
        }

        User actor = resolveUser(actorUserId);
        if (request != null && request.edits() != null) {
            applyUpsertFields(article, request.edits(), false);
        }
        validateAttributionAndContent(article);

        Instant now = Instant.now();
        article.setStatus(ArticleStatus.PUBLISHED);
        article.setPublishedAt(now);
        article.setScheduledAt(null);
        article.setUnpublishedAt(null);
        article.setReviewedBy(actor);
        article.setUpdatedBy(actor);

        Article saved = articleRepository.saveAndFlush(article);

        if (request != null && request.shouldSetAsMainHeadline()) {
            articleRepository.clearOtherMainHeadlines(saved.getId());
            articleRepository.promoteMainHeadline(saved.getId());
            saved.setMainHeadline(true);
            recordAudit(saved, actor, AuditAction.SET_MAIN_HEADLINE,
                    ArticleStatus.PUBLISHED.name(), ArticleStatus.PUBLISHED.name(), Map.of());
        }

        recordAudit(saved, actor, AuditAction.APPROVED_PUBLISHED,
                fromStatus.name(), ArticleStatus.PUBLISHED.name(), Map.of());

        revalidationService.invalidateNowAndNotifyAsync("ARTICLE_PUBLISHED", saved.getSlug());
        return mapper.toAdminDetail(saved, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public AdminArticleDetail scheduleArticle(UUID id, ScheduleArticleRequest request, UUID actorUserId) {
        Article article = requireArticle(id);
        ArticleStatus fromStatus = article.getStatus();
        if (fromStatus != ArticleStatus.PENDING_REVIEW && fromStatus != ArticleStatus.SCHEDULED) {
            throw new InvalidStateTransitionException(
                    "Somente artigos em PENDING_REVIEW ou SCHEDULED podem ser agendados (atual: " + fromStatus + ")");
        }

        if (request.scheduledAt() == null || !request.scheduledAt().isAfter(Instant.now())) {
            throw new BusinessValidationException("scheduledAt deve ser uma data/hora futura");
        }

        User actor = resolveUser(actorUserId);
        if (request.edits() != null) {
            applyUpsertFields(article, request.edits(), false);
        }
        validateAttributionAndContent(article);

        article.setStatus(ArticleStatus.SCHEDULED);
        article.setScheduledAt(request.scheduledAt());
        article.setMainHeadline(false);
        article.setReviewedBy(actor);
        article.setUpdatedBy(actor);

        Article saved = articleRepository.save(article);
        recordAudit(saved, actor, AuditAction.SCHEDULED,
                fromStatus.name(), ArticleStatus.SCHEDULED.name(),
                Map.of("scheduledAt", request.scheduledAt().toString()));

        return mapper.toAdminDetail(saved, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public AdminArticleDetail cancelSchedule(UUID id, UUID actorUserId) {
        Article article = requireArticle(id);
        if (article.getStatus() != ArticleStatus.SCHEDULED) {
            throw new InvalidStateTransitionException(
                    "Somente artigos SCHEDULED podem ter o agendamento cancelado (atual: " + article.getStatus() + ")");
        }

        User actor = resolveUser(actorUserId);
        article.setStatus(ArticleStatus.PENDING_REVIEW);
        article.setScheduledAt(null);
        article.setUpdatedBy(actor);

        Article saved = articleRepository.save(article);
        recordAudit(saved, actor, AuditAction.EDITED,
                ArticleStatus.SCHEDULED.name(), ArticleStatus.PENDING_REVIEW.name(),
                Map.of("action", "cancel_schedule"));

        return mapper.toAdminDetail(saved, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public AdminArticleDetail discardArticle(UUID id, ReasonRequest request, UUID actorUserId) {
        Article article = requireArticle(id);
        ArticleStatus fromStatus = article.getStatus();
        if (fromStatus != ArticleStatus.PENDING_REVIEW && fromStatus != ArticleStatus.SCHEDULED) {
            throw new InvalidStateTransitionException(
                    "Não é permitido descartar artigo em estado " + fromStatus + ". Utilize unpublish para matérias publicadas.");
        }

        User actor = resolveUser(actorUserId);
        article.setStatus(ArticleStatus.DISCARDED);
        article.setScheduledAt(null);
        article.setMainHeadline(false);
        article.setDiscardedAt(Instant.now());
        article.setReviewedBy(actor);
        article.setUpdatedBy(actor);

        Article saved = articleRepository.save(article);
        Map<String, Object> metadata = (request != null && StringUtils.hasText(request.reason()))
                ? Map.of("reason", htmlSanitizer.stripAllHtml(request.reason()))
                : Map.of();
        recordAudit(saved, actor, AuditAction.DISCARDED,
                fromStatus.name(), ArticleStatus.DISCARDED.name(), metadata);

        return mapper.toAdminDetail(saved, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public AdminArticleDetail unpublishArticle(UUID id, ReasonRequest request, UUID actorUserId) {
        Article article = requireArticle(id);
        if (article.getStatus() != ArticleStatus.PUBLISHED) {
            throw new InvalidStateTransitionException(
                    "Somente artigos PUBLISHED podem ser retirados do ar (atual: " + article.getStatus() + ")");
        }

        User actor = resolveUser(actorUserId);
        boolean wasMainHeadline = article.isMainHeadline();

        article.setStatus(ArticleStatus.UNPUBLISHED);
        article.setMainHeadline(false);
        article.setUnpublishedAt(Instant.now());
        article.setUpdatedBy(actor);

        // Preserves viewsCount, likesCount, savesCount, commentsCount and publishedAt integrally
        Article saved = articleRepository.saveAndFlush(article);

        Map<String, Object> metadata = (request != null && StringUtils.hasText(request.reason()))
                ? Map.of("reason", htmlSanitizer.stripAllHtml(request.reason()))
                : Map.of();
        recordAudit(saved, actor, AuditAction.UNPUBLISHED,
                ArticleStatus.PUBLISHED.name(), ArticleStatus.UNPUBLISHED.name(), metadata);

        if (wasMainHeadline) {
            recordAudit(saved, actor, AuditAction.UNSET_MAIN_HEADLINE,
                    ArticleStatus.PUBLISHED.name(), ArticleStatus.UNPUBLISHED.name(), Map.of());
            // Promote most recent other PUBLISHED article to keep Hero non-empty
            articleRepository.findTopByStatusAndIdNotOrderByPublishedAtDescCreatedAtDesc(
                            ArticleStatus.PUBLISHED, saved.getId())
                    .ifPresent(fallback -> {
                        fallback.setMainHeadline(true);
                        articleRepository.save(fallback);
                        recordAudit(fallback, actor, AuditAction.SET_MAIN_HEADLINE,
                                ArticleStatus.PUBLISHED.name(), ArticleStatus.PUBLISHED.name(),
                                Map.of("reason", "fallback_after_main_headline_unpublished"));
                    });
        }

        revalidationService.invalidateNowAndNotifyAsync("ARTICLE_UNPUBLISHED", saved.getSlug());
        return mapper.toAdminDetail(saved, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public AdminArticleDetail republishArticle(UUID id, UUID actorUserId) {
        Article article = requireArticle(id);
        if (article.getStatus() != ArticleStatus.UNPUBLISHED) {
            throw new InvalidStateTransitionException(
                    "Somente artigos UNPUBLISHED podem ser republicados (atual: " + article.getStatus() + ")");
        }

        validateAttributionAndContent(article);
        User actor = resolveUser(actorUserId);
        article.setStatus(ArticleStatus.PUBLISHED);
        article.setUnpublishedAt(null);
        if (article.getPublishedAt() == null) {
            article.setPublishedAt(Instant.now());
        }
        article.setUpdatedBy(actor);

        Article saved = articleRepository.save(article);
        recordAudit(saved, actor, AuditAction.REPUBLISHED,
                ArticleStatus.UNPUBLISHED.name(), ArticleStatus.PUBLISHED.name(), Map.of());

        revalidationService.invalidateNowAndNotifyAsync("ARTICLE_PUBLISHED", saved.getSlug());
        return mapper.toAdminDetail(saved, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public AdminArticleDetail setMainHeadline(UUID id, UUID actorUserId) {
        Article article = requireArticle(id);
        if (article.getStatus() != ArticleStatus.PUBLISHED) {
            throw new InvalidStateTransitionException(
                    "Somente artigos PUBLISHED podem ser definidos como Manchete Principal (atual: " + article.getStatus() + ")");
        }

        User actor = resolveUser(actorUserId);
        articleRepository.clearOtherMainHeadlines(id);
        int updated = articleRepository.promoteMainHeadline(id);
        if (updated == 0) {
            throw new InvalidStateTransitionException("Falha ao promover Manchete Principal: artigo não está publicado");
        }

        Article refreshed = requireArticle(id);
        refreshed.setMainHeadline(true);
        recordAudit(refreshed, actor, AuditAction.SET_MAIN_HEADLINE,
                ArticleStatus.PUBLISHED.name(), ArticleStatus.PUBLISHED.name(), Map.of());

        revalidationService.invalidateNowAndNotifyAsync("MAIN_HEADLINE_CHANGED", refreshed.getSlug());
        return mapper.toAdminDetail(refreshed, articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(id));
    }

    @Transactional
    public int publishDueScheduledArticles() {
        Instant now = Instant.now();
        List<Article> due = articleRepository.findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
                ArticleStatus.SCHEDULED, now);
        int count = 0;
        for (Article article : due) {
            if (article.getScheduledAt() != null && article.getScheduledAt().isAfter(now)) {
                continue;
            }
            try {
                validateAttributionAndContent(article);
            } catch (BusinessValidationException ex) {
                log.error("Blocked scheduled publication for article '{}' (id={}): {}",
                        article.getSlug(), article.getId(), ex.getMessage());
                continue;
            }
            Instant publishedAt = article.getScheduledAt() != null ? article.getScheduledAt() : now;
            article.setStatus(ArticleStatus.PUBLISHED);
            article.setPublishedAt(publishedAt);
            article.setScheduledAt(null);
            Article saved = articleRepository.save(article);
            recordAudit(saved, null, AuditAction.AUTO_PUBLISHED_BY_SCHEDULER,
                    ArticleStatus.SCHEDULED.name(), ArticleStatus.PUBLISHED.name(), Map.of());
            revalidationService.invalidateNowAndNotifyAsync("ARTICLE_PUBLISHED", saved.getSlug());
            count++;
        }
        return count;
    }

    private void applyUpsertFields(Article article, AdminArticleUpsertRequest req, boolean isNew) {
        String cleanHeadline = htmlSanitizer.stripAllHtml(req.headline());
        String cleanLead = htmlSanitizer.stripAllHtml(req.lead());
        String cleanReels = htmlSanitizer.stripAllHtml(req.reelsSummary());
        String cleanAuthor = htmlSanitizer.stripAllHtml(req.authorName());
        String cleanSourceName = htmlSanitizer.stripAllHtml(req.sourceName());
        String rawSourceUrl = req.sourceUrl() != null ? req.sourceUrl().trim() : null;
        String rawCoverUrl = StringUtils.hasText(req.coverImageUrl()) ? req.coverImageUrl().trim() : null;

        String slugInput = StringUtils.hasText(req.slug()) ? req.slug() : cleanHeadline;
        String uniqueSlug = isNew
                ? slugService.generateUniqueSlug(slugInput)
                : slugService.ensureUniqueSlugForUpdate(slugInput, article.getSlug());

        article.setSlug(uniqueSlug);
        article.setHeadline(cleanHeadline);
        article.setSubheadlineBullets(htmlSanitizer.sanitizeList(req.subheadlineBullets()));
        article.setLead(cleanLead);
        article.setBodyParagraphs(htmlSanitizer.sanitizeList(req.bodyParagraphs()));
        article.setReelsSummary(cleanReels);
        article.setCategory(req.category());
        article.setEditorialFormat(req.editorialFormat());
        article.setTags(htmlSanitizer.sanitizeList(req.tags()));
        article.setCoverImageUrl(rawCoverUrl);
        article.setCoverArtKey(req.category().defaultCoverArtKey());
        article.setReadingTimeMinutes(req.readingTimeMinutes() != null ? req.readingTimeMinutes() : 2);
        article.setReviewScore(req.reviewScore());
        article.setUrgent(Boolean.TRUE.equals(req.isUrgent()));
        article.setAuthorName(cleanAuthor);
        article.setContentType(req.contentType());
        article.setSourceName(cleanSourceName);
        article.setSourceUrl(rawSourceUrl);
    }

    public void validateAttributionAndContent(Article article) {
        if (!StringUtils.hasText(article.getAuthorName()) || article.getAuthorName().trim().length() < 2) {
            throw new BusinessValidationException("Atribuição inválida: authorName é obrigatório (mín. 2 caracteres)");
        }
        if (article.getContentType() == null) {
            throw new BusinessValidationException("Atribuição inválida: contentType é obrigatório (AUTORAL ou CURADORIA)");
        }
        if (!StringUtils.hasText(article.getSourceName()) || article.getSourceName().trim().length() < 2) {
            throw new BusinessValidationException("Atribuição inválida: sourceName é obrigatório (mín. 2 caracteres)");
        }
        if (!urlSecurityValidator.isValidHttpUrl(article.getSourceUrl())) {
            throw new BusinessValidationException("Atribuição inválida: sourceUrl deve usar protocolo http:// ou https://");
        }
        if (StringUtils.hasText(article.getCoverImageUrl())
                && !urlSecurityValidator.isValidHttpUrl(article.getCoverImageUrl())) {
            throw new BusinessValidationException("URL de capa inválida: coverImageUrl deve usar protocolo http:// ou https://");
        }
        if (!StringUtils.hasText(article.getHeadline()) || !StringUtils.hasText(article.getLead())
                || article.getBodyParagraphs() == null || article.getBodyParagraphs().isEmpty()) {
            throw new BusinessValidationException("Conteúdo editorial incompleto: manchete, lead e corpo são obrigatórios");
        }
    }

    private Article requireArticle(UUID id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artigo não encontrado: " + id));
    }

    private User resolveUser(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId).orElse(null);
    }

    private void recordAudit(
            Article article,
            User actor,
            AuditAction action,
            String fromStatus,
            String toStatus,
            Map<String, Object> metadata
    ) {
        EditorialAuditLog logEntry = new EditorialAuditLog();
        logEntry.setArticle(article);
        logEntry.setActorUser(actor);
        logEntry.setAction(action);
        logEntry.setFromStatus(fromStatus);
        logEntry.setToStatus(toStatus);
        logEntry.setMetadata(metadata != null ? metadata : Map.of());
        auditLogRepository.save(logEntry);
    }
}
