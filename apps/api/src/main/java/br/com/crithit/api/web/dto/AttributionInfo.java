package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.ContentType;

public record AttributionInfo(
        String authorName,
        ContentType contentType,
        String sourceName,
        String sourceUrl
) {}
