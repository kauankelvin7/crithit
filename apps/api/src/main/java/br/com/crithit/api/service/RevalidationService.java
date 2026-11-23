package br.com.crithit.api.service;

import br.com.crithit.api.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

/**
 * Invalidates Redis editorial caches and triggers Next.js On-Demand Revalidation asynchronously.
 */
@Service
public class RevalidationService {

    private static final Logger log = LoggerFactory.getLogger(RevalidationService.class);

    private final ArticleCacheService cacheService;
    private final AppProperties properties;
    private final RestClient restClient;

    public RevalidationService(ArticleCacheService cacheService, AppProperties properties) {
        this.cacheService = cacheService;
        this.properties = properties;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public void invalidateNowAndNotifyAsync(String eventType, String slug) {
        cacheService.evictEditorialCaches(slug);
        notifyWebAsync(eventType, slug);
    }

    @Async("taskExecutor")
    public void notifyWebAsync(String eventType, String slug) {
        AppProperties.RevalidateProperties rev = properties.revalidate();
        if (rev == null || !rev.enabled() || !StringUtils.hasText(rev.url())) {
            return;
        }
        try {
            var requestSpec = restClient.post()
                    .uri(rev.url())
                    .contentType(MediaType.APPLICATION_JSON);

            if (StringUtils.hasText(rev.secret())) {
                requestSpec.header("X-Revalidate-Secret", rev.secret());
            }

            requestSpec.body(Map.of(
                    "event", eventType,
                    "slug", slug != null ? slug : ""
            )).retrieve().toBodilessEntity();

            log.debug("Triggered Next.js revalidation event={} slug={}", eventType, slug);
        } catch (Exception ex) {
            log.warn("Failed to call Next.js revalidate webhook ({}): {}", rev.url(), ex.getMessage());
        }
    }
}
