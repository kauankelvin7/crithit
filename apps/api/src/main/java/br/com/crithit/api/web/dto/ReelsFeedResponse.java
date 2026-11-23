package br.com.crithit.api.web.dto;

import java.util.List;

public record ReelsFeedResponse(
        List<PublicArticleSummary> items,
        int page,
        int size,
        long totalElements,
        boolean hasNext,
        boolean focusSlugFound
) {}
