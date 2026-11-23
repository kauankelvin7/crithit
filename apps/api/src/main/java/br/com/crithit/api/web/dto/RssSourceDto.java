package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.Category;

import java.time.Instant;
import java.util.UUID;

public record RssSourceDto(
        UUID id,
        String name,
        String feedUrl,
        String siteUrl,
        String language,
        Category defaultCategory,
        boolean active,
        int consecutiveFailures,
        Instant circuitOpenUntil,
        Instant lastFetchedAt,
        String lastErrorMessage
) {}
