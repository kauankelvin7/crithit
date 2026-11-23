package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PublicArticleSummary(
        UUID id,
        String slug,
        Category category,
        EditorialFormat editorialFormat,
        String headline,
        List<String> subheadlineBullets,
        String lead,
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
        AttributionInfo attribution
) {}
