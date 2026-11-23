package br.com.crithit.api.ai;

import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.service.SlugService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Deterministic offline/default editorial adapter active when AI_API_KEY is not configured.
 */
@Component
@ConditionalOnMissingBean(EditorialAiClient.class)
public class DeterministicEditorialAiClient implements EditorialAiClient {

    private final HtmlSanitizer htmlSanitizer;
    private final SlugService slugService;

    public DeterministicEditorialAiClient(HtmlSanitizer htmlSanitizer, SlugService slugService) {
        this.htmlSanitizer = htmlSanitizer;
        this.slugService = slugService;
    }

    @Override
    public LlmAdaptationResult adaptArticle(RawFeedItem item) {
        String cleanTitle = htmlSanitizer.stripAllHtml(item.rawTitle());
        if (cleanTitle == null || cleanTitle.isBlank()) {
            cleanTitle = "Atualização editorial de " + item.sourceName();
        }
        String headline = truncate(cleanTitle, 110);

        String cleanExcerpt = htmlSanitizer.stripAllHtml(
                item.rawExcerpt() != null && !item.rawExcerpt().isBlank()
                        ? item.rawExcerpt()
                        : item.fullText()
        );
        if (cleanExcerpt == null || cleanExcerpt.isBlank()) {
            cleanExcerpt = cleanTitle + " — informações apuradas originalmente por " + item.sourceName() + ".";
        }

        String lead = ensureMinLength(
                truncate(cleanExcerpt, 300),
                "Confira os principais detalhes divulgados por " + item.sourceName() + " sobre: " + cleanTitle + "."
        );

        String reelsSummary = ensureMinLength(
                truncate(cleanTitle + ": " + cleanExcerpt, 250),
                "Resumo rápido CritHit! baseado na publicação original de " + item.sourceName() + "."
        );

        List<String> paragraphs = new ArrayList<>();
        paragraphs.add(lead);
        paragraphs.add("Segundo informações publicadas originalmente por " + item.sourceName()
                + ", o tema segue em acompanhamento pela redação do CritHit! para revisão final.");

        Category category = item.defaultCategory() != null ? item.defaultCategory() : Category.GAMES;
        List<String> bullets = List.of(
                truncate("Fonte original: " + item.sourceName(), 120),
                truncate("Editoria sugerida: " + category.name(), 120)
        );
        List<String> tags = List.of(
                category.name().toLowerCase(Locale.ROOT),
                slugService.slugify(item.sourceName()),
                "curadoria"
        );
        List<String> notes = List.of(
                "Rascunho gerado pelo adaptador determinístico local (sem AI_API_KEY). Revisar tradução/contexto antes de publicar."
        );

        return new LlmAdaptationResult(
                headline,
                bullets,
                lead,
                paragraphs,
                reelsSummary,
                category,
                EditorialFormat.NEWS,
                tags,
                slugService.slugify(headline),
                2,
                notes
        );
    }

    private String truncate(String text, int maxLen) {
        if (text.length() <= maxLen) {
            return text;
        }
        return text.substring(0, maxLen - 3).trim() + "...";
    }

    private String ensureMinLength(String candidate, String fallbackSuffix) {
        if (candidate.length() >= 30) {
            return candidate;
        }
        return truncate(candidate + " " + fallbackSuffix, 260);
    }
}
