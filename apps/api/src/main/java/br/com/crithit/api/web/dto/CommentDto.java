package br.com.crithit.api.web.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UUID articleId,
        String authorDisplayName,
        String body,
        Instant createdAt
) {}
