package br.com.crithit.api.web.dto;

import jakarta.validation.constraints.Size;

public record ReasonRequest(
        @Size(max = 300, message = "Motivo deve ter no máximo 300 caracteres")
        String reason
) {}
