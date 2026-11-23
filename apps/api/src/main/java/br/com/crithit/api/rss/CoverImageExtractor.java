package br.com.crithit.api.rss;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.security.UrlSecurityValidator;
import com.rometools.rome.feed.synd.SyndEnclosure;
import com.rometools.rome.feed.synd.SyndEntry;
import org.jdom2.Element;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Extracts and validates cover image URLs following deterministic priority:
 * 1) media:content / media:thumbnail
 * 2) RSS enclosure image/*
 * 3) Open Graph / Twitter Card metatags via JSoup (with anti-SSRF check)
 */
@Component
public class CoverImageExtractor {

    private static final Logger log = LoggerFactory.getLogger(CoverImageExtractor.class);
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(".svg", ".gif");

    private final UrlSecurityValidator urlSecurityValidator;
    private final int connectTimeoutMs;
    private final String userAgent;

    public CoverImageExtractor(UrlSecurityValidator urlSecurityValidator, AppProperties properties) {
        this.urlSecurityValidator = urlSecurityValidator;
        this.connectTimeoutMs = Math.max(2000, properties.rss().connectTimeoutMs());
        this.userAgent = properties.rss().userAgent();
    }

    public String extractValidCoverUrl(SyndEntry entry, String articleUrl, boolean fetchPageMetadata) {
        // 1. media:content / media:thumbnail from foreign markup
        String fromMedia = extractFromForeignMarkup(entry.getForeignMarkup(), articleUrl);
        if (isSafeImageUrl(fromMedia)) {
            return fromMedia;
        }

        // 2. RSS enclosure
        if (entry.getEnclosures() != null) {
            for (SyndEnclosure enclosure : entry.getEnclosures()) {
                if (enclosure.getType() != null
                        && enclosure.getType().toLowerCase(Locale.ROOT).startsWith("image/")
                        && isSafeImageUrl(enclosure.getUrl())) {
                    return enclosure.getUrl().trim();
                }
            }
        }

        // 3. Fallback to Open Graph / Twitter Card via JSoup with SSRF validation
        if (fetchPageMetadata && StringUtils.hasText(articleUrl)) {
            return extractFromHtmlMeta(articleUrl);
        }
        return null;
    }

    private String extractFromForeignMarkup(List<Element> foreignMarkup, String baseUrl) {
        if (foreignMarkup == null) {
            return null;
        }
        for (Element el : foreignMarkup) {
            String name = el.getName();
            if ("content".equalsIgnoreCase(name) || "thumbnail".equalsIgnoreCase(name)) {
                String url = el.getAttributeValue("url");
                String type = el.getAttributeValue("type");
                String medium = el.getAttributeValue("medium");
                if (StringUtils.hasText(url)) {
                    boolean looksImage = (medium == null || "image".equalsIgnoreCase(medium))
                            && (type == null || type.toLowerCase(Locale.ROOT).startsWith("image/"));
                    if (looksImage) {
                        String resolved = resolveAbsolute(baseUrl, url);
                        if (isSafeImageUrl(resolved)) {
                            return resolved;
                        }
                    }
                }
            }
            if ("group".equalsIgnoreCase(name)) {
                String nested = extractFromForeignMarkup(el.getChildren(), baseUrl);
                if (nested != null) {
                    return nested;
                }
            }
        }
        return null;
    }

    private String extractFromHtmlMeta(String articleUrl) {
        try {
            URI safeUri = urlSecurityValidator.assertSafeForOutboundFetch(articleUrl);
            Document doc = Jsoup.connect(safeUri.toString())
                    .userAgent(userAgent)
                    .timeout(connectTimeoutMs)
                    .maxBodySize(1024 * 1024)
                    .followRedirects(false)
                    .get();

            String[] selectors = {
                    "meta[property=og:image]",
                    "meta[name=twitter:image]",
                    "meta[name=twitter:image:src]"
            };
            for (String selector : selectors) {
                var meta = doc.selectFirst(selector);
                if (meta != null) {
                    String candidate = resolveAbsolute(articleUrl, meta.attr("content"));
                    if (isSafeImageUrl(candidate)) {
                        return candidate;
                    }
                }
            }
        } catch (Exception ex) {
            log.debug("Could not extract OG image from {}: {}", articleUrl, ex.getMessage());
        }
        return null;
    }

    public boolean isSafeImageUrl(String candidate) {
        if (!urlSecurityValidator.isValidHttpUrl(candidate)) {
            return false;
        }
        String lower = candidate.trim().toLowerCase(Locale.ROOT);
        int queryIdx = lower.indexOf('?');
        String pathOnly = queryIdx > 0 ? lower.substring(0, queryIdx) : lower;
        for (String blocked : BLOCKED_EXTENSIONS) {
            if (pathOnly.endsWith(blocked)) {
                return false;
            }
        }
        return !lower.contains("1x1") && !lower.contains("pixel");
    }

    private String resolveAbsolute(String baseUrl, String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return null;
        }
        String trimmed = candidate.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        try {
            URI resolved = URI.create(baseUrl).resolve(trimmed);
            return resolved.toString();
        } catch (Exception ex) {
            return null;
        }
    }
}
