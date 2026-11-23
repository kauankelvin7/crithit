package br.com.crithit.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "crithit")
public record AppProperties(
        CorsProperties cors,
        SecurityProperties security,
        AdminSeedProperties adminSeed,
        AiProperties ai,
        RssProperties rss,
        RevalidateProperties revalidate,
        NotificationProperties notifications
) {
    public AppProperties {
        if (notifications == null) {
            notifications = new NotificationProperties("", "", "", "http://localhost:3000");
        }
    }
    public record CorsProperties(List<String> allowedOrigins) {
        public CorsProperties {
            if (allowedOrigins == null || allowedOrigins.isEmpty()) {
                allowedOrigins = List.of("http://localhost:3000");
            }
        }
    }

    public record SecurityProperties(
            JwtProperties jwt,
            String visitorHashSalt,
            boolean cookieSecure
    ) {
        public record JwtProperties(
                String secret,
                String issuer,
                long accessExpirationSeconds,
                long refreshExpirationSeconds
        ) {}
    }

    public record AdminSeedProperties(
            String email,
            String password,
            String displayName
    ) {}

    public record AiProperties(
            String apiKey,
            String baseUrl,
            String model,
            String embeddingModel,
            int embeddingDimensions,
            long timeoutMs,
            int maxRetries
    ) {}

    public record RssProperties(
            boolean enabled,
            String cron,
            int maxConcurrentFetches,
            int connectTimeoutMs,
            int readTimeoutMs,
            int maxPayloadBytes,
            double dedupSimilarityThreshold,
            int dedupWindowHours,
            int circuitFailureThreshold,
            int circuitBaseCooldownMinutes,
            String userAgent
    ) {}

    public record RevalidateProperties(
            String url,
            String secret,
            boolean enabled
    ) {}

    public record NotificationProperties(
            String discordWebhookUrl,
            String telegramBotToken,
            String telegramChatId,
            String appWebPublicUrl
    ) {}
}
