package br.com.crithit.api.web.dto;

import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.security.ValidHttpUrl;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record AdminArticleUpsertRequest(
        @Size(max = 180, message = "Slug deve ter no máximo 180 caracteres")
        String slug,

        @NotBlank(message = "Manchete é obrigatória")
        @Size(min = 5, max = 180, message = "Manchete deve ter entre 5 e 180 caracteres")
        String headline,

        @NotNull(message = "subheadlineBullets é obrigatório")
        @Size(max = 5, message = "Máximo de 5 tópicos de subtítulo")
        List<String> subheadlineBullets,

        @NotBlank(message = "Lead é obrigatório")
        @Size(min = 20, message = "Lead deve ter pelo menos 20 caracteres")
        String lead,

        @NotEmpty(message = "Corpo da matéria deve ter pelo menos 1 parágrafo")
        List<String> bodyParagraphs,

        @NotBlank(message = "Resumo para Reels é obrigatório")
        @Size(min = 20, max = 320, message = "Resumo para Reels deve ter entre 20 e 320 caracteres")
        String reelsSummary,

        @NotNull(message = "Editoria (category) é obrigatória")
        Category category,

        @NotNull(message = "Formato editorial é obrigatório")
        EditorialFormat editorialFormat,

        List<String> tags,

        @ValidHttpUrl(allowNull = true, message = "coverImageUrl deve usar esquema http:// ou https:// válido")
        @Size(max = 2048, message = "coverImageUrl excede 2048 caracteres")
        String coverImageUrl,

        @Min(value = 1, message = "Tempo de leitura mínimo é 1 minuto")
        @Max(value = 60, message = "Tempo de leitura máximo é 60 minutos")
        Integer readingTimeMinutes,

        @DecimalMin(value = "0.0", message = "Nota mínima é 0.0")
        @DecimalMax(value = "10.0", message = "Nota máxima é 10.0")
        BigDecimal reviewScore,

        Boolean isUrgent,

        @NotBlank(message = "authorName é obrigatório")
        @Size(min = 2, max = 120, message = "authorName deve ter entre 2 e 120 caracteres")
        String authorName,

        @NotNull(message = "contentType é obrigatório (AUTORAL ou CURADORIA)")
        ContentType contentType,

        @NotBlank(message = "sourceName é obrigatório")
        @Size(min = 2, max = 120, message = "sourceName deve ter entre 2 e 120 caracteres")
        String sourceName,

        @NotBlank(message = "sourceUrl é obrigatória")
        @ValidHttpUrl(message = "sourceUrl deve usar esquema http:// ou https:// válido")
        @Size(max = 2048, message = "sourceUrl excede 2048 caracteres")
        String sourceUrl
) {}
