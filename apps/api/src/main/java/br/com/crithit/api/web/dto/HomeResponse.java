package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.Category;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record HomeResponse(
        List<BreakingTickerItem> breakingTicker,
        PublicArticleSummary mainHeadline,
        List<PublicArticleSummary> secondaryHeadlines,
        List<PublicArticleSummary> urgentNews,
        List<PublicArticleSummary> giroGeek,
        List<PublicArticleSummary> columnsAndReviews,
        List<PublicArticleSummary> featuredReels,
        Map<Category, List<PublicArticleSummary>> categoryBlocks,
        List<PublicArticleSummary> mostRead,
        Instant generatedAt
) {
    public record BreakingTickerItem(
            String slug,
            String headline,
            Category category,
            Instant publishedAt
    ) {}
}
