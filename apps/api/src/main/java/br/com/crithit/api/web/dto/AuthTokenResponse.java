package br.com.crithit.api.web.dto;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        AdminUserDto user
) {}
