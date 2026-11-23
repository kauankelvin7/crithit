package br.com.crithit.api.web.dto;

import java.util.UUID;

public record LikeToggleResponse(UUID articleId, boolean liked, long likesCount) {}
