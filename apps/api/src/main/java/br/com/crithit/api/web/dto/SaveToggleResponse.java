package br.com.crithit.api.web.dto;

import java.util.UUID;

public record SaveToggleResponse(UUID articleId, boolean saved, long savesCount) {}
