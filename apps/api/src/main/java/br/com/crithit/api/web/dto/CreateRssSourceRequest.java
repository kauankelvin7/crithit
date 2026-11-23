package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.security.ValidHttpUrl;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateRssSourceRequest(
        @NotBlank(message = "Nome da fonte é obrigatório")
        @Size(min = 2, max = 120, message = "Nome deve ter entre 2 e 120 caracteres")
        String name,

        @NotBlank(message = "feedUrl é obrigatória")
        @ValidHttpUrl(message = "feedUrl deve usar esquema http:// ou https:// válido")
        @Size(max = 2048)
        String feedUrl,

        @NotBlank(message = "siteUrl é obrigatória")
        @ValidHttpUrl(message = "siteUrl deve usar esquema http:// ou https:// válido")
        @Size(max = 2048)
        String siteUrl,

        @NotBlank(message = "Idioma é obrigatório")
        @Pattern(regexp = "pt-BR|en|es|ja", message = "Idioma deve ser pt-BR, en, es ou ja")
        String language,

        @NotNull(message = "defaultCategory é obrigatória")
        Category defaultCategory,

        Boolean active
) {}
