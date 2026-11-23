package br.com.crithit.api.web.dto;

import java.time.Instant;

public record RssTriggerResponse(
        boolean triggered,
        String message,
        Instant startedAt
) {}
