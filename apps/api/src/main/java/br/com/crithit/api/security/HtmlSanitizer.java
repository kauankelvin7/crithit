package br.com.crithit.api.security;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Sanitizes untrusted HTML/text inputs using JSoup {@link Safelist#none()}.
 */
@Component
public class HtmlSanitizer {

    private static final Document.OutputSettings NO_PRETTY_PRINT =
            new Document.OutputSettings().prettyPrint(false);

    /**
     * Strips all HTML tags and normalizes whitespace.
     */
    public String stripAllHtml(String input) {
        if (input == null) {
            return null;
        }
        String cleaned = Jsoup.clean(input, "", Safelist.none(), NO_PRETTY_PRINT);
        // Unescape common entities produced by Jsoup.clean when plain text contains & or quotes
        cleaned = org.jsoup.parser.Parser.unescapeEntities(cleaned, false);
        return cleaned.replaceAll("\\s+", " ").trim();
    }

    /**
     * Sanitizes a list of plain text entries, dropping empty entries after stripping HTML.
     */
    public List<String> sanitizeList(List<String> items) {
        if (items == null) {
            return List.of();
        }
        List<String> sanitized = new ArrayList<>();
        for (String item : items) {
            String clean = stripAllHtml(item);
            if (clean != null && !clean.isBlank()) {
                sanitized.add(clean);
            }
        }
        return sanitized;
    }
}
