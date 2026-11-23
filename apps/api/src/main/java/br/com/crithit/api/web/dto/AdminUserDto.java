package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.UserRole;

import java.util.UUID;

public record AdminUserDto(
        UUID id,
        String email,
        String displayName,
        UserRole role
) {}
