package br.com.crithit.api.ai;

import br.com.crithit.api.domain.enums.Category;

public record RawFeedItem(
        String sourceName,
        String sourceUrl,
        Category defaultCategory,
        String language,
        String rawTitle,
        String rawExcerpt,
        String fullText
) {}
