package br.com.crithit.api.security;

import org.junit.jupiter.api.Test;

import java.net.InetAddress;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UrlSecurityValidatorTest {

    private final UrlSecurityValidator validator = new UrlSecurityValidator();

    @Test
    void acceptsValidHttpAndHttpsUrls() {
        assertThat(validator.isValidHttpUrl("https://www.ign.com/articles/gta-6")).isTrue();
        assertThat(validator.isValidHttpUrl("http://feeds.feedburner.com/ign/all")).isTrue();
        assertThat(validator.isValidHttpUrl("  https://omelete.com.br/rss  ")).isTrue();
    }

    @Test
    void rejectsMaliciousNonHttpSchemesAndRelativeUrls() {
        assertThat(validator.isValidHttpUrl("javascript:alert(1)")).isFalse();
        assertThat(validator.isValidHttpUrl("JAVASCRIPT:alert(document.cookie)")).isFalse();
        assertThat(validator.isValidHttpUrl("data:text/html,<script>alert(1)</script>")).isFalse();
        assertThat(validator.isValidHttpUrl("vbscript:msgbox(1)")).isFalse();
        assertThat(validator.isValidHttpUrl("file:///etc/passwd")).isFalse();
        assertThat(validator.isValidHttpUrl("/noticia/relativa")).isFalse();
        assertThat(validator.isValidHttpUrl("https://ign.com/invalid url")).isFalse();
        assertThat(validator.isValidHttpUrl(null)).isFalse();
        assertThat(validator.isValidHttpUrl("   ")).isFalse();
    }

    @Test
    void blocksSsrfHostsAndPrivateIpRanges() throws Exception {
        assertThatThrownBy(() -> validator.assertSafeForOutboundFetch("http://localhost:8080/feed"))
                .isInstanceOf(SecurityException.class);
        assertThatThrownBy(() -> validator.assertSafeForOutboundFetch("http://127.0.0.1/admin"))
                .isInstanceOf(SecurityException.class);
        assertThatThrownBy(() -> validator.assertSafeForOutboundFetch("http://169.254.169.254/latest/meta-data/"))
                .isInstanceOf(SecurityException.class);

        assertThat(validator.isBlockedAddress(InetAddress.getByName("127.0.0.1"))).isTrue();
        assertThat(validator.isBlockedAddress(InetAddress.getByName("10.0.0.5"))).isTrue();
        assertThat(validator.isBlockedAddress(InetAddress.getByName("172.16.10.2"))).isTrue();
        assertThat(validator.isBlockedAddress(InetAddress.getByName("192.168.1.1"))).isTrue();
        assertThat(validator.isBlockedAddress(InetAddress.getByName("169.254.169.254"))).isTrue();
        assertThat(validator.isBlockedAddress(InetAddress.getByName("fc00::1"))).isTrue();
        assertThat(validator.isBlockedAddress(InetAddress.getByName("8.8.8.8"))).isFalse();
    }
}
