package br.com.crithit.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "Nome do autor é obrigatório")
        @Size(min = 2, max = 60, message = "Nome deve ter entre 2 e 60 caracteres")
        String authorDisplayName,

        @NotBlank(message = "Comentário não pode ser vazio")
        @Size(min = 3, max = 1000, message = "Comentário deve ter entre 3 e 1000 caracteres")
        String body
) {}
