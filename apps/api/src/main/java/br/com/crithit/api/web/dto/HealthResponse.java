package br.com.crithit.api.web.dto;

import java.time.Instant;

public record HealthResponse(
        String status,
        String database,
        String redis,
        Instant timestamp
) {}
