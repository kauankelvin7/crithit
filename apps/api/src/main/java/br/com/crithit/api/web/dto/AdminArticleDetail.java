package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminArticleDetail(
        UUID id,
        String slug,
        Category category,
        EditorialFormat editorialFormat,
        String headline,
        List<String> subheadlineBullets,
        String lead,
        List<String> bodyParagraphs,
        String reelsSummary,
        List<String> tags,
        String coverImageUrl,
        String coverArtKey,
        int readingTimeMinutes,
        BigDecimal reviewScore,
        boolean isMainHeadline,
        boolean isUrgent,
        long viewsCount,
        long likesCount,
        long savesCount,
        long commentsCount,
        Instant publishedAt,
        AttributionInfo attribution,
        ArticleStatus status,
        AiStatus aiStatus,
        Instant scheduledAt,
        Instant unpublishedAt,
        Instant discardedAt,
        Instant createdAt,
        Instant updatedAt,
        long matchedSourcesCount,
        String rawTitle,
        String rawExcerpt,
        List<String> editorialNotes,
        List<MatchedSourceDto> matchedSources
) {}
