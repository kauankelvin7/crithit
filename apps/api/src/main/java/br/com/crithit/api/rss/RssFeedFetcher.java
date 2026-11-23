package br.com.crithit.api.rss;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.security.UrlSecurityValidator;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Fetches and parses RSS/Atom feeds with strict timeouts, payload caps, and anti-SSRF validation.
 */
@Component
public class RssFeedFetcher {

    private final UrlSecurityValidator urlSecurityValidator;
    private final HttpClient httpClient;
    private final Duration readTimeout;
    private final int maxPayloadBytes;
    private final String userAgent;

    public RssFeedFetcher(UrlSecurityValidator urlSecurityValidator, AppProperties properties) {
        this.urlSecurityValidator = urlSecurityValidator;
        this.readTimeout = Duration.ofMillis(Math.max(2000, properties.rss().readTimeoutMs()));
        this.maxPayloadBytes = Math.max(512 * 1024, properties.rss().maxPayloadBytes());
        this.userAgent = properties.rss().userAgent();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(2000, properties.rss().connectTimeoutMs())))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
    }

    public SyndFeed fetch(String feedUrl) throws Exception {
        URI currentUri = urlSecurityValidator.assertSafeForOutboundFetch(feedUrl);

        HttpResponse<InputStream> response = sendWithSafeRedirects(currentUri, 3);
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + " fetching RSS feed: " + feedUrl);
        }

        byte[] bytes;
        try (InputStream body = response.body()) {
            bytes = body.readNBytes(maxPayloadBytes + 1);
            if (bytes.length > maxPayloadBytes) {
                throw new IOException("RSS payload exceeds limit of " + maxPayloadBytes + " bytes");
            }
        }

        SyndFeedInput input = new SyndFeedInput();
        input.setAllowDoctypes(false);
        return input.build(new XmlReader(new ByteArrayInputStream(bytes)));
    }

    private HttpResponse<InputStream> sendWithSafeRedirects(URI uri, int remainingRedirects)
            throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(readTimeout)
                .header("User-Agent", userAgent)
                .header("Accept", "application/rss+xml, application/atom+xml, application/xml, text/xml")
                .GET()
                .build();

        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        int code = response.statusCode();
        if (code >= 300 && code < 400 && remainingRedirects > 0) {
            String location = response.headers().firstValue("Location").orElse(null);
            response.body().close();
            if (location == null) {
                throw new IOException("Redirect without Location header");
            }
            URI nextUri = uri.resolve(location);
            urlSecurityValidator.assertSafeForOutboundFetch(nextUri.toString());
            return sendWithSafeRedirects(nextUri, remainingRedirects - 1);
        }
        return response;
    }
}
