package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.security.ValidHttpUrl;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateRssSourceRequest(
        @Size(min = 2, max = 120, message = "Nome deve ter entre 2 e 120 caracteres")
        String name,

        @ValidHttpUrl(allowNull = true, message = "feedUrl deve usar esquema http:// ou https:// válido")
        @Size(max = 2048)
        String feedUrl,

        @ValidHttpUrl(allowNull = true, message = "siteUrl deve usar esquema http:// ou https:// válido")
        @Size(max = 2048)
        String siteUrl,

        @Pattern(regexp = "pt-BR|en|es|ja", message = "Idioma deve ser pt-BR, en, es ou ja")
        String language,

        Category defaultCategory,

        Boolean active
) {}
