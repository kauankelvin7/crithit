package br.com.crithit.api.rss;

import br.com.crithit.api.ai.EmbeddingClient;
import br.com.crithit.api.ai.LlmAdaptationResult;
import br.com.crithit.api.ai.LlmAdaptationService;
import br.com.crithit.api.ai.RawFeedItem;
import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.ArticleSource;
import br.com.crithit.api.domain.entity.EditorialAuditLog;
import br.com.crithit.api.domain.entity.RssSource;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.AuditAction;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.domain.type.PgVectorUserType;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.repository.ArticleSourceRepository;
import br.com.crithit.api.repository.EditorialAuditLogRepository;
import br.com.crithit.api.repository.RssSourceRepository;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.UrlSecurityValidator;
import br.com.crithit.api.service.EditorialNotificationService;
import br.com.crithit.api.service.EditorialNotificationService.PendingNotificationPayload;
import br.com.crithit.api.service.SlugService;
import com.rometools.rome.feed.synd.SyndContent;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Semaphore;

/**
 * Orchestrates concurrent RSS collection on Java 21 Virtual Threads with Semaphore bulkhead,
 * per-source circuit breaker, 2-level deduplication (canonical URL + pgvector >= 0.82),
 * and safe LLM adaptation into PENDING_REVIEW.
 */
@Service
public class RssIngestionService {

    private static final Logger log = LoggerFactory.getLogger(RssIngestionService.class);
    private static final String CURATED_AUTHOR = "Redação CritHit!";

    private final RssSourceRepository rssSourceRepository;
    private final ArticleRepository articleRepository;
    private final ArticleSourceRepository articleSourceRepository;
    private final EditorialAuditLogRepository auditLogRepository;
    private final RssFeedFetcher feedFetcher;
    private final CoverImageExtractor coverImageExtractor;
    private final UrlNormalizer urlNormalizer;
    private final UrlSecurityValidator urlSecurityValidator;
    private final HtmlSanitizer htmlSanitizer;
    private final EmbeddingClient embeddingClient;
    private final LlmAdaptationService llmAdaptationService;
    private final SlugService slugService;
    private final TransactionTemplate transactionTemplate;
    private final ExecutorService virtualThreadExecutor;
    private final Semaphore fetchBulkhead;
    private final AppProperties properties;
    private final EditorialNotificationService notificationService;

    public RssIngestionService(
            RssSourceRepository rssSourceRepository,
            ArticleRepository articleRepository,
            ArticleSourceRepository articleSourceRepository,
            EditorialAuditLogRepository auditLogRepository,
            RssFeedFetcher feedFetcher,
            CoverImageExtractor coverImageExtractor,
            UrlNormalizer urlNormalizer,
            UrlSecurityValidator urlSecurityValidator,
            HtmlSanitizer htmlSanitizer,
            EmbeddingClient embeddingClient,
            LlmAdaptationService llmAdaptationService,
            SlugService slugService,
            TransactionTemplate transactionTemplate,
            @Qualifier("rssVirtualThreadExecutor") ExecutorService virtualThreadExecutor,
            AppProperties properties
    ) {
        this(
                rssSourceRepository,
                articleRepository,
                articleSourceRepository,
                auditLogRepository,
                feedFetcher,
                coverImageExtractor,
                urlNormalizer,
                urlSecurityValidator,
                htmlSanitizer,
                embeddingClient,
                llmAdaptationService,
                slugService,
                transactionTemplate,
                virtualThreadExecutor,
                properties,
                null
        );
    }

    @Autowired
    public RssIngestionService(
            RssSourceRepository rssSourceRepository,
            ArticleRepository articleRepository,
            ArticleSourceRepository articleSourceRepository,
            EditorialAuditLogRepository auditLogRepository,
            RssFeedFetcher feedFetcher,
            CoverImageExtractor coverImageExtractor,
            UrlNormalizer urlNormalizer,
            UrlSecurityValidator urlSecurityValidator,
            HtmlSanitizer htmlSanitizer,
            EmbeddingClient embeddingClient,
            LlmAdaptationService llmAdaptationService,
            SlugService slugService,
            TransactionTemplate transactionTemplate,
            @Qualifier("rssVirtualThreadExecutor") ExecutorService virtualThreadExecutor,
            AppProperties properties,
            EditorialNotificationService notificationService
    ) {
        this.rssSourceRepository = rssSourceRepository;
        this.articleRepository = articleRepository;
        this.articleSourceRepository = articleSourceRepository;
        this.auditLogRepository = auditLogRepository;
        this.feedFetcher = feedFetcher;
        this.coverImageExtractor = coverImageExtractor;
        this.urlNormalizer = urlNormalizer;
        this.urlSecurityValidator = urlSecurityValidator;
        this.htmlSanitizer = htmlSanitizer;
        this.embeddingClient = embeddingClient;
        this.llmAdaptationService = llmAdaptationService;
        this.slugService = slugService;
        this.transactionTemplate = transactionTemplate;
        this.virtualThreadExecutor = virtualThreadExecutor;
        this.fetchBulkhead = new Semaphore(Math.max(1, properties.rss().maxConcurrentFetches()));
        this.properties = properties;
        this.notificationService = notificationService;
    }

    public void triggerAsyncIngestion(UUID sourceId) {
        virtualThreadExecutor.submit(() -> {
            if (sourceId != null) {
                rssSourceRepository.findById(sourceId).ifPresent(this::ingestSingleSourceSafely);
            } else {
                ingestAllActiveSources();
            }
        });
    }

    public void ingestAllActiveSources() {
        List<RssSource> activeSources = rssSourceRepository.findByActiveTrueOrderByNameAsc();
        if (activeSources.isEmpty()) {
            return;
        }
        List<CompletableFuture<Void>> futures = activeSources.stream()
                .map(source -> CompletableFuture.runAsync(() -> ingestSingleSourceSafely(source), virtualThreadExecutor))
                .toList();
        CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
    }

    private void ingestSingleSourceSafely(RssSource source) {
        Instant now = Instant.now();
        if (source.getCircuitOpenUntil() != null && source.getCircuitOpenUntil().isAfter(now)) {
            log.debug("Skipping RSS source '{}' because circuit is open until {}",
                    source.getName(), source.getCircuitOpenUntil());
            return;
        }

        boolean acquired = false;
        try {
            fetchBulkhead.acquire();
            acquired = true;
            SyndFeed feed = feedFetcher.fetch(source.getFeedUrl());
            recordSourceSuccess(source.getId());

            List<SyndEntry> entries = feed.getEntries();
            if (entries != null) {
                int limit = Math.min(entries.size(), 25);
                for (int i = 0; i < limit; i++) {
                    processEntrySafely(source, entries.get(i));
                }
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        } catch (Exception ex) {
            log.warn("RSS source '{}' failed: {}", source.getName(), ex.getMessage());
            recordSourceFailure(source.getId(), ex.getMessage());
        } finally {
            if (acquired) {
                fetchBulkhead.release();
            }
        }
    }

    public IngestionResult processFeedEntry(RssSource source, SyndEntry entry, boolean fetchCoverMeta) {
        String link = entry.getLink();
        if (!urlSecurityValidator.isValidHttpUrl(link)) {
            return IngestionResult.INVALID_URL;
        }
        String normalizedUrl = urlNormalizer.normalize(link);
        String urlHash = urlNormalizer.canonicalHash(normalizedUrl);

        if (articleRepository.existsByCanonicalUrlHash(urlHash)
                || articleSourceRepository.existsByCanonicalUrlHash(urlHash)) {
            return IngestionResult.DUPLICATE_EXACT_URL;
        }

        String rawTitle = truncate(htmlSanitizer.stripAllHtml(entry.getTitle()), 300);
        if (!StringUtils.hasText(rawTitle)) {
            return IngestionResult.INVALID_CONTENT;
        }
        String rawExcerpt = extractCleanExcerpt(entry);
        String embeddingInput = rawTitle + "\n" + truncate(rawExcerpt, 800);

        float[] embedding = null;
        boolean embeddingFailed = false;
        try {
            embedding = embeddingClient.generateEmbedding(embeddingInput);
        } catch (Exception ex) {
            embeddingFailed = true;
            log.warn("Embedding generation failed for '{}': {}", rawTitle, ex.getMessage());
        }

        // Level 2: Semantic Deduplication via pgvector >= 0.82 within 72h window
        if (embedding != null) {
            Instant cutoff = Instant.now().minus(properties.rss().dedupWindowHours(), ChronoUnit.HOURS);
            double threshold = properties.rss().dedupSimilarityThreshold();
            String vectorLiteral = PgVectorUserType.toVectorLiteral(embedding);
            Optional<ArticleRepository.SemanticMatchProjection> matchOpt =
                    articleRepository.findBestSemanticMatch(vectorLiteral, cutoff, threshold);

            if (matchOpt.isPresent()) {
                ArticleRepository.SemanticMatchProjection match = matchOpt.get();
                if (ArticleStatus.DISCARDED.name().equals(match.getStatus())) {
                    log.info("Skipping entry '{}' matching DISCARDED cluster '{}' (score={})",
                            rawTitle, match.getHeadline(), match.getSimilarityScore());
                    return IngestionResult.DISCARDED_CLUSTER_MATCH;
                }
                attachMatchedSource(match.getArticleId(), source, normalizedUrl, urlHash, rawTitle, rawExcerpt, match.getSimilarityScore());
                return IngestionResult.MATCHED_EXISTING_CLUSTER;
            }
        }

        String coverUrl = coverImageExtractor.extractValidCoverUrl(entry, normalizedUrl, fetchCoverMeta);
        RawFeedItem rawFeedItem = new RawFeedItem(
                source.getName(),
                normalizedUrl,
                source.getDefaultCategory(),
                source.getLanguage(),
                rawTitle,
                rawExcerpt,
                rawExcerpt
        );

        LlmAdaptationService.AdaptationOutcome outcome = llmAdaptationService.adaptWithFallback(rawFeedItem);
        AiStatus finalAiStatus = embeddingFailed ? AiStatus.FALLBACK_RAW : outcome.aiStatus();

        persistNewPendingDraft(source, normalizedUrl, urlHash, rawTitle, rawExcerpt, coverUrl, embedding, outcome.result(), finalAiStatus);
        return finalAiStatus == AiStatus.FALLBACK_RAW
                ? IngestionResult.CREATED_FALLBACK_RAW
                : IngestionResult.CREATED_PENDING_REVIEW;
    }

    private void processEntrySafely(RssSource source, SyndEntry entry) {
        try {
            processFeedEntry(source, entry, true);
        } catch (Exception ex) {
            log.warn("Failed processing RSS entry from '{}': {}", source.getName(), ex.getMessage());
        }
    }

    private void attachMatchedSource(
            UUID articleId,
            RssSource source,
            String normalizedUrl,
            String urlHash,
            String rawTitle,
            String rawExcerpt,
            double similarityScore
    ) {
        transactionTemplate.executeWithoutResult(status -> {
            if (articleSourceRepository.existsByCanonicalUrlHash(urlHash)) {
                return;
            }
            Article article = articleRepository.findById(articleId).orElse(null);
            if (article == null) {
                return;
            }
            ArticleSource matched = new ArticleSource();
            matched.setArticle(article);
            matched.setRssSource(source);
            matched.setSourceName(source.getName());
            matched.setSourceUrl(normalizedUrl);
            matched.setCanonicalUrlHash(urlHash);
            matched.setOriginalTitle(rawTitle);
            matched.setOriginalExcerpt(rawExcerpt);
            matched.setSimilarityScore(BigDecimal.valueOf(similarityScore).setScale(4, RoundingMode.HALF_UP));
            matched.setPrimary(false);
            matched.setFetchedAt(Instant.now());
            articleSourceRepository.save(matched);

            EditorialAuditLog logEntry = new EditorialAuditLog();
            logEntry.setArticle(article);
            logEntry.setAction(AuditAction.MATCHED_SOURCE_ADDED);
            logEntry.setFromStatus(article.getStatus().name());
            logEntry.setToStatus(article.getStatus().name());
            logEntry.setMetadata(Map.of(
                    "sourceName", source.getName(),
                    "sourceUrl", normalizedUrl,
                    "similarityScore", similarityScore
            ));
            auditLogRepository.save(logEntry);
        });
    }

    private void persistNewPendingDraft(
            RssSource source,
            String normalizedUrl,
            String urlHash,
            String rawTitle,
            String rawExcerpt,
            String coverUrl,
            float[] embedding,
            LlmAdaptationResult adapted,
            AiStatus aiStatus
    ) {
        transactionTemplate.executeWithoutResult(status -> {
            if (articleRepository.existsByCanonicalUrlHash(urlHash)
                    || articleSourceRepository.existsByCanonicalUrlHash(urlHash)) {
                return;
            }
            Category category = adapted.category() != null ? adapted.category() : source.getDefaultCategory();
            String slug = slugService.generateUniqueSlug(adapted.suggestedSlug());

            Article article = new Article();
            article.setSlug(slug);
            // Human-in-the-loop rule: RSS ingestion ALWAYS enters as PENDING_REVIEW
            article.setStatus(ArticleStatus.PENDING_REVIEW);
            article.setAiStatus(aiStatus);
            article.setCategory(category);
            article.setEditorialFormat(adapted.editorialFormat());
            article.setContentType(ContentType.CURADORIA);
            article.setAuthorName(CURATED_AUTHOR);
            article.setSourceName(source.getName());
            article.setSourceUrl(normalizedUrl);
            article.setCanonicalUrlHash(urlHash);
            article.setHeadline(truncate(adapted.headline(), 180));
            article.setSubheadlineBullets(new ArrayList<>(adapted.subheadlineBullets()));
            article.setLead(adapted.lead());
            article.setBodyParagraphs(new ArrayList<>(adapted.bodyParagraphs()));
            article.setReelsSummary(truncate(adapted.reelsSummary(), 320));
            article.setTags(new ArrayList<>(adapted.tags()));
            article.setCoverImageUrl(coverUrl);
            article.setCoverArtKey(category.defaultCoverArtKey());
            article.setReadingTimeMinutes(adapted.readingTimeMinutes() != null ? adapted.readingTimeMinutes() : 2);
            article.setMainHeadline(false);
            article.setUrgent(false);
            article.setRawTitle(rawTitle);
            article.setRawExcerpt(rawExcerpt);
            article.setEditorialNotes(new ArrayList<>(adapted.editorialNotes()));
            article.setEmbedding(embedding);
            article.setPrimaryRssSource(source);

            Article saved = articleRepository.save(article);

            ArticleSource primarySource = new ArticleSource();
            primarySource.setArticle(saved);
            primarySource.setRssSource(source);
            primarySource.setSourceName(source.getName());
            primarySource.setSourceUrl(normalizedUrl);
            primarySource.setCanonicalUrlHash(urlHash);
            primarySource.setOriginalTitle(rawTitle);
            primarySource.setOriginalExcerpt(rawExcerpt);
            primarySource.setSimilarityScore(BigDecimal.ONE.setScale(4, RoundingMode.HALF_UP));
            primarySource.setPrimary(true);
            primarySource.setFetchedAt(Instant.now());
            articleSourceRepository.save(primarySource);

            EditorialAuditLog logEntry = new EditorialAuditLog();
            logEntry.setArticle(saved);
            logEntry.setAction(aiStatus == AiStatus.FALLBACK_RAW
                    ? AuditAction.INGESTED_FALLBACK_RAW
                    : AuditAction.INGESTED_RSS);
            logEntry.setToStatus(ArticleStatus.PENDING_REVIEW.name());
            logEntry.setMetadata(Map.of(
                    "rssSourceId", source.getId().toString(),
                    "sourceName", source.getName()
            ));
            auditLogRepository.save(logEntry);

            if (notificationService != null) {
                try {
                    notificationService.notifyNewPendingArticleAsync(new PendingNotificationPayload(
                            saved.getId(),
                            saved.getHeadline(),
                            saved.getCategory(),
                            List.of(source.getName()),
                            aiStatus,
                            normalizedUrl
                    ));
                } catch (Exception ex) {
                    log.warn("Notification trigger failed without affecting RSS ingestion for '{}': {}",
                            saved.getHeadline(), ex.getMessage());
                }
            }
        });
    }

    private void recordSourceSuccess(UUID sourceId) {
        transactionTemplate.executeWithoutResult(status ->
                rssSourceRepository.findById(sourceId).ifPresent(src -> {
                    src.setConsecutiveFailures(0);
                    src.setCircuitOpenUntil(null);
                    src.setLastErrorMessage(null);
                    src.setLastFetchedAt(Instant.now());
                    rssSourceRepository.save(src);
                })
        );
    }

    private void recordSourceFailure(UUID sourceId, String errorMessage) {
        transactionTemplate.executeWithoutResult(status ->
                rssSourceRepository.findById(sourceId).ifPresent(src -> {
                    int failures = src.getConsecutiveFailures() + 1;
                    src.setConsecutiveFailures(failures);
                    src.setLastFetchedAt(Instant.now());
                    src.setLastErrorMessage(truncate(errorMessage, 500));

                    int threshold = Math.max(1, properties.rss().circuitFailureThreshold());
                    if (failures >= threshold) {
                        int exponent = Math.min(4, failures - threshold);
                        long cooldownMinutes = (long) properties.rss().circuitBaseCooldownMinutes() * (1L << exponent);
                        src.setCircuitOpenUntil(Instant.now().plus(cooldownMinutes, ChronoUnit.MINUTES));
                    }
                    rssSourceRepository.save(src);
                })
        );
    }

    private String extractCleanExcerpt(SyndEntry entry) {
        String rawDesc = entry.getDescription() != null ? entry.getDescription().getValue() : null;
        if (!StringUtils.hasText(rawDesc) && entry.getContents() != null && !entry.getContents().isEmpty()) {
            SyndContent content = entry.getContents().get(0);
            rawDesc = content != null ? content.getValue() : null;
        }
        String clean = htmlSanitizer.stripAllHtml(rawDesc);
        return clean != null ? truncate(clean, 2000) : "";
    }

    private String truncate(String val, int maxLen) {
        if (val == null) return null;
        String trimmed = val.trim();
        return trimmed.length() <= maxLen ? trimmed : trimmed.substring(0, maxLen).trim();
    }

    public enum IngestionResult {
        CREATED_PENDING_REVIEW,
        CREATED_FALLBACK_RAW,
        MATCHED_EXISTING_CLUSTER,
        DISCARDED_CLUSTER_MATCH,
        DUPLICATE_EXACT_URL,
        INVALID_URL,
        INVALID_CONTENT
    }
}
