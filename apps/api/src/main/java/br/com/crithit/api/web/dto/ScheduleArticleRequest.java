package br.com.crithit.api.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record ScheduleArticleRequest(
        @NotNull(message = "scheduledAt é obrigatório")
        Instant scheduledAt,

        @Valid
        AdminArticleUpsertRequest edits
) {}
