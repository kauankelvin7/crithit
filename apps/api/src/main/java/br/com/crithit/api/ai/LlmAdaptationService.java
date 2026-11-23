package br.com.crithit.api.ai;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.service.SlugService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Orchestrates LLM adaptation with retry + strict schema validation and guarantees
 * safe FALLBACK_RAW output on any failure/timeout/malformed JSON.
 */
@Service
public class LlmAdaptationService {

    private static final Logger log = LoggerFactory.getLogger(LlmAdaptationService.class);

    private final EditorialAiClient aiClient;
    private final HtmlSanitizer htmlSanitizer;
    private final SlugService slugService;
    private final int maxRetries;

    public LlmAdaptationService(
            EditorialAiClient aiClient,
            HtmlSanitizer htmlSanitizer,
            SlugService slugService,
            AppProperties properties
    ) {
        this.aiClient = aiClient;
        this.htmlSanitizer = htmlSanitizer;
        this.slugService = slugService;
        this.maxRetries = Math.max(1, properties.ai().maxRetries());
    }

    public AdaptationOutcome adaptWithFallback(RawFeedItem item) {
        Exception lastError = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                LlmAdaptationResult rawResult = aiClient.adaptArticle(item);
                LlmAdaptationResult sanitized = validateAndSanitize(rawResult, item);
                return new AdaptationOutcome(AiStatus.SUCCESS, sanitized);
            } catch (AiNonRetryableException ex) {
                log.warn("Non-retryable LLM error for '{}': {}", item.rawTitle(), ex.getMessage());
                lastError = ex;
                break;
            } catch (Exception ex) {
                lastError = ex;
                log.warn("Transient LLM error (attempt {}/{}) for '{}': {}",
                        attempt, maxRetries, item.rawTitle(), ex.getMessage());
                if (attempt < maxRetries) {
                    backoffSleep(attempt);
                }
            }
        }

        log.error("LLM adaptation failed; applying safe FALLBACK_RAW for '{}' ({}): {}",
                item.rawTitle(), item.sourceUrl(), lastError != null ? lastError.getMessage() : "unknown");
        return new AdaptationOutcome(AiStatus.FALLBACK_RAW, buildFallbackRaw(item, lastError));
    }

    private LlmAdaptationResult validateAndSanitize(LlmAdaptationResult res, RawFeedItem item) {
        if (res == null) {
            throw new AiNonRetryableException("LLM returned null payload");
        }
        String headline = htmlSanitizer.stripAllHtml(res.headline());
        String lead = htmlSanitizer.stripAllHtml(res.lead());
        String reels = htmlSanitizer.stripAllHtml(res.reelsSummary());
        List<String> bullets = htmlSanitizer.sanitizeList(res.subheadlineBullets());
        List<String> paragraphs = htmlSanitizer.sanitizeList(res.bodyParagraphs());
        List<String> tags = htmlSanitizer.sanitizeList(res.tags());
        List<String> notes = htmlSanitizer.sanitizeList(res.editorialNotes());

        if (!StringUtils.hasText(headline) || !StringUtils.hasText(lead)
                || !StringUtils.hasText(reels) || paragraphs.isEmpty()) {
            throw new AiNonRetryableException("LLM JSON missing required editorial fields");
        }

        if (headline.length() > 180) {
            headline = headline.substring(0, 177).trim() + "...";
        }
        if (reels.length() > 320) {
            reels = reels.substring(0, 317).trim() + "...";
        }
        if (bullets.size() > 5) {
            bullets = bullets.subList(0, 5);
        }

        Category category = res.category() != null ? res.category()
                : (item.defaultCategory() != null ? item.defaultCategory() : Category.GAMES);
        EditorialFormat format = res.editorialFormat() != null ? res.editorialFormat() : EditorialFormat.NEWS;
        String suggestedSlug = StringUtils.hasText(res.suggestedSlug())
                ? slugService.slugify(res.suggestedSlug())
                : slugService.slugify(headline);
        int readingTime = res.readingTimeMinutes() != null
                ? Math.min(60, Math.max(1, res.readingTimeMinutes())) : 2;

        return new LlmAdaptationResult(
                headline, bullets, lead, paragraphs, reels,
                category, format, tags, suggestedSlug, readingTime, notes
        );
    }

    private LlmAdaptationResult buildFallbackRaw(RawFeedItem item, Exception cause) {
        String cleanTitle = htmlSanitizer.stripAllHtml(item.rawTitle());
        if (!StringUtils.hasText(cleanTitle)) {
            cleanTitle = "Pauta coletada de " + item.sourceName();
        }
        String headline = cleanTitle.length() > 180 ? cleanTitle.substring(0, 177).trim() + "..." : cleanTitle;

        String cleanExcerpt = htmlSanitizer.stripAllHtml(item.rawExcerpt());
        if (!StringUtils.hasText(cleanExcerpt)) {
            cleanExcerpt = cleanTitle + " (conteúdo bruto preservado para revisão editorial).";
        }
        String lead = cleanExcerpt;
        if (lead.length() < 20) {
            lead = lead + " — aguardando redação e verificação editorial.";
        }
        String reels = cleanTitle.length() > 320 ? cleanTitle.substring(0, 317).trim() + "..." : cleanTitle;
        if (reels.length() < 20) {
            reels = reels + " — pauta de " + item.sourceName();
        }

        Category category = item.defaultCategory() != null ? item.defaultCategory() : Category.GAMES;
        String reason = cause != null ? cause.getMessage() : "Falha na API do provedor LLM";

        return new LlmAdaptationResult(
                headline,
                List.of("Fallback bruto preservado para revisão humana"),
                lead,
                List.of(lead),
                reels,
                category,
                EditorialFormat.NEWS,
                List.of("revisao-manual"),
                slugService.slugify(headline),
                2,
                List.of("FALLBACK_RAW: Falha na adaptação automática por IA (" + reason + "). Revisar e traduzir manualmente.")
        );
    }

    private void backoffSleep(int attempt) {
        long baseMs = (long) Math.pow(2, attempt) * 500L;
        long jitter = ThreadLocalRandom.current().nextLong(100L, 400L);
        try {
            Thread.sleep(baseMs + jitter);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    public record AdaptationOutcome(AiStatus aiStatus, LlmAdaptationResult result) {}
}
