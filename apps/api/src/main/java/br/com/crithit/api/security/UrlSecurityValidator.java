package br.com.crithit.api.security;

import org.springframework.stereotype.Component;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;

/**
 * Validates HTTP/HTTPS URLs and enforces anti-SSRF restrictions for outbound fetches.
 */
@Component
public class UrlSecurityValidator {

    private static final int MAX_URL_LENGTH = 2048;

    /**
     * Strictly validates that a URL uses http:// or https:// with a non-empty host.
     * Rejects javascript:, data:, vbscript:, file:, relative URLs, etc.
     */
    public boolean isValidHttpUrl(String rawUrl) {
        if (rawUrl == null) {
            return false;
        }
        String trimmed = rawUrl.trim();
        if (trimmed.isEmpty() || trimmed.length() > MAX_URL_LENGTH) {
            return false;
        }
        for (int i = 0; i < trimmed.length(); i++) {
            if (Character.isWhitespace(trimmed.charAt(i)) || Character.isISOControl(trimmed.charAt(i))) {
                return false;
            }
        }
        try {
            URI uri = URI.create(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null) {
                return false;
            }
            String lowerScheme = scheme.toLowerCase(Locale.ROOT);
            if (!"http".equals(lowerScheme) && !"https".equals(lowerScheme)) {
                return false;
            }
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return false;
            }
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    /**
     * Validates URL syntax and resolves DNS to block loopback, private, link-local,
     * metadata (169.254.169.254), multicast, and ULA addresses (anti-SSRF).
     */
    public URI assertSafeForOutboundFetch(String rawUrl) {
        if (!isValidHttpUrl(rawUrl)) {
            throw new IllegalArgumentException("URL must use http:// or https:// with a valid host");
        }
        URI uri = URI.create(rawUrl.trim());
        String host = uri.getHost().toLowerCase(Locale.ROOT);

        if ("localhost".equals(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
            throw new SecurityException("Blocked SSRF target host: " + host);
        }

        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            if (addresses.length == 0) {
                throw new SecurityException("Host could not be resolved: " + host);
            }
            for (InetAddress addr : addresses) {
                if (isBlockedAddress(addr)) {
                    throw new SecurityException("Blocked SSRF IP address for host " + host + ": " + addr.getHostAddress());
                }
            }
            return uri;
        } catch (UnknownHostException ex) {
            throw new IllegalArgumentException("Unable to resolve host: " + host, ex);
        }
    }

    public boolean isBlockedAddress(InetAddress addr) {
        if (addr.isAnyLocalAddress()
                || addr.isLoopbackAddress()
                || addr.isLinkLocalAddress()
                || addr.isSiteLocalAddress()
                || addr.isMulticastAddress()) {
            return true;
        }
        byte[] bytes = addr.getAddress();
        if (bytes.length == 4) {
            int b0 = bytes[0] & 0xFF;
            int b1 = bytes[1] & 0xFF;
            // 0.0.0.0/8 ("this network")
            if (b0 == 0) return true;
            // 100.64.0.0/10 (CGNAT)
            if (b0 == 100 && b1 >= 64 && b1 <= 127) return true;
            // 169.254.0.0/16 (Link-local / cloud metadata 169.254.169.254)
            if (b0 == 169 && b1 == 254) return true;
            // 172.16.0.0/12 (Private RFC 1918)
            if (b0 == 172 && b1 >= 16 && b1 <= 31) return true;
            // 192.168.0.0/16 (Private RFC 1918)
            if (b0 == 192 && b1 == 168) return true;
            // 10.0.0.0/8 (Private RFC 1918)
            if (b0 == 10) return true;
        } else if (addr instanceof Inet6Address) {
            int firstByte = bytes[0] & 0xFF;
            // Unique Local Address fc00::/7
            if ((firstByte & 0xFE) == 0xFC) {
                return true;
            }
        }
        return false;
    }
}
