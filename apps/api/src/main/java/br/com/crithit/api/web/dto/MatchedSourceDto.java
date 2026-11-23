package br.com.crithit.api.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MatchedSourceDto(
        UUID id,
        String sourceName,
        String sourceUrl,
        String originalTitle,
        String originalExcerpt,
        BigDecimal similarityScore,
        boolean isPrimary,
        Instant fetchedAt
) {}
