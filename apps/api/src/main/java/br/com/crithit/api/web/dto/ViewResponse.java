package br.com.crithit.api.web.dto;

import java.util.UUID;

public record ViewResponse(UUID articleId, long viewsCount, boolean counted) {}
