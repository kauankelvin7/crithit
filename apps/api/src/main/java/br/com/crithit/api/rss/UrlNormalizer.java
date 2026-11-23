package br.com.crithit.api.rss;

import br.com.crithit.api.security.VisitorIdentityResolver;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Normalizes article URLs by stripping tracking query parameters and computes canonical SHA-256 hashes.
 */
@Component
public class UrlNormalizer {

    private static final Set<String> TRACKING_PARAMS = Set.of(
            "fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid",
            "igshid", "ref", "ref_src", "ref_url", "spm", "yclid"
    );

    public String normalize(String rawUrl) {
        if (rawUrl == null) {
            return "";
        }
        String trimmed = rawUrl.trim();
        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase(Locale.ROOT) : "https";
            String host = uri.getHost() != null ? uri.getHost().toLowerCase(Locale.ROOT) : "";
            int port = uri.getPort();
            boolean defaultPort = (port == -1)
                    || ("http".equals(scheme) && port == 80)
                    || ("https".equals(scheme) && port == 443);

            String path = uri.getRawPath();
            if (path == null || path.isEmpty()) {
                path = "/";
            } else if (path.length() > 1 && path.endsWith("/")) {
                path = path.substring(0, path.length() - 1);
            }

            String query = filterQuery(uri.getRawQuery());
            StringBuilder sb = new StringBuilder();
            sb.append(scheme).append("://").append(host);
            if (!defaultPort) {
                sb.append(':').append(port);
            }
            sb.append(path);
            if (query != null && !query.isEmpty()) {
                sb.append('?').append(query);
            }
            return sb.toString();
        } catch (URISyntaxException ex) {
            return trimmed;
        }
    }

    public String canonicalHash(String rawUrl) {
        return VisitorIdentityResolver.sha256Hex(normalize(rawUrl));
    }

    private String filterQuery(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return null;
        }
        String[] pairs = rawQuery.split("&");
        List<String> kept = new ArrayList<>();
        for (String pair : pairs) {
            if (pair.isBlank()) continue;
            int eq = pair.indexOf('=');
            String key = (eq > 0 ? pair.substring(0, eq) : pair).toLowerCase(Locale.ROOT);
            if (key.startsWith("utm_") || TRACKING_PARAMS.contains(key)) {
                continue;
            }
            kept.add(pair);
        }
        if (kept.isEmpty()) {
            return null;
        }
        kept.sort(String::compareTo);
        return String.join("&", kept);
    }
}
