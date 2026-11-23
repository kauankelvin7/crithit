package br.com.crithit.api.security;

import br.com.crithit.api.config.AppProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Resolves anonymous visitor identity from X-Visitor-Id header or HttpOnly cookie,
 * hashing it with server salt before storing in database/Redis.
 */
@Component
public class VisitorIdentityResolver {

    public static final String VISITOR_COOKIE_NAME = "crithit_visitor_id";
    public static final String VISITOR_HEADER_NAME = "X-Visitor-Id";

    private final String salt;
    private final boolean cookieSecure;

    public VisitorIdentityResolver(AppProperties properties) {
        String configuredSalt = properties.security().visitorHashSalt();
        this.salt = StringUtils.hasText(configuredSalt) ? configuredSalt : "crithit-default-salt";
        this.cookieSecure = properties.security().cookieSecure();
    }

    public String resolveVisitorHash(HttpServletRequest request, HttpServletResponse response, boolean createCookieIfMissing) {
        String visitorId = extractVisitorId(request);
        if (visitorId == null) {
            visitorId = UUID.randomUUID().toString();
            if (createCookieIfMissing && response != null) {
                ResponseCookie cookie = ResponseCookie.from(VISITOR_COOKIE_NAME, visitorId)
                        .httpOnly(true)
                        .secure(cookieSecure)
                        .sameSite("Lax")
                        .path("/")
                        .maxAge(Duration.ofDays(365))
                        .build();
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            }
        }
        return sha256Hex(visitorId + ":" + salt);
    }

    public String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            int commaIdx = xff.indexOf(',');
            return (commaIdx > 0 ? xff.substring(0, commaIdx) : xff).trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null ? remoteAddr : "unknown";
    }

    public String hashIp(HttpServletRequest request) {
        return sha256Hex(resolveClientIp(request) + ":" + salt);
    }

    private String extractVisitorId(HttpServletRequest request) {
        String headerVal = request.getHeader(VISITOR_HEADER_NAME);
        if (isValidUuid(headerVal)) {
            return headerVal.trim();
        }
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (VISITOR_COOKIE_NAME.equals(cookie.getName()) && isValidUuid(cookie.getValue())) {
                    return cookie.getValue().trim();
                }
            }
        }
        return null;
    }

    private boolean isValidUuid(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return false;
        }
        try {
            UUID.fromString(candidate.trim());
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }
}
