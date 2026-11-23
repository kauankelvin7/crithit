package br.com.crithit.api.service;

import br.com.crithit.api.repository.ArticleRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class SlugService {

    private static final Pattern NON_SLUG_CHARS = Pattern.compile("[^a-z0-9\\s-]");
    private static final Pattern WHITESPACE_OR_DASH = Pattern.compile("[\\s-]+");

    private final ArticleRepository articleRepository;

    public SlugService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    public String slugify(String raw) {
        if (raw == null || raw.isBlank()) {
            return "materia-crithit";
        }
        String normalized = Normalizer.normalize(raw.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String cleaned = NON_SLUG_CHARS.matcher(normalized).replaceAll(" ").trim();
        String collapsed = WHITESPACE_OR_DASH.matcher(cleaned).replaceAll("-");
        collapsed = collapsed.replaceAll("^-+|-+$", "");
        if (collapsed.isBlank()) {
            return "materia-crithit";
        }
        return collapsed.length() > 160 ? collapsed.substring(0, 160).replaceAll("-+$", "") : collapsed;
    }

    public String generateUniqueSlug(String candidate) {
        String base = slugify(candidate);
        if (!articleRepository.existsBySlug(base)) {
            return base;
        }
        for (int suffix = 2; suffix < 1000; suffix++) {
            String candidateSlug = truncateForSuffix(base, "-" + suffix);
            if (!articleRepository.existsBySlug(candidateSlug)) {
                return candidateSlug;
            }
        }
        return truncateForSuffix(base, "-" + System.currentTimeMillis());
    }

    public String ensureUniqueSlugForUpdate(String candidate, String currentSlug) {
        String base = slugify(candidate);
        if (base.equals(currentSlug) || !articleRepository.existsBySlug(base)) {
            return base;
        }
        return generateUniqueSlug(base);
    }

    private String truncateForSuffix(String base, String suffix) {
        int maxBase = 180 - suffix.length();
        String trimmedBase = base.length() > maxBase ? base.substring(0, maxBase).replaceAll("-+$", "") : base;
        return trimmedBase + suffix;
    }
}
