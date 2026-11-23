package br.com.crithit.api.service;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.Category;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Decoupled notification service using Java 21 {@link HttpClient} on Virtual Threads
 * to alert editors via Discord and/or Telegram whenever a new article enters PENDING_REVIEW.
 * Never throws or rolls back RSS ingestion on missing config, HTTP errors, or timeouts.
 */
@Service
public class EditorialNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EditorialNotificationService.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(6);
    private static final String DEFAULT_WEB_PUBLIC_URL = "http://localhost:3000";

    private final AppProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final ExecutorService virtualThreadExecutor;
    private final String telegramApiBaseUrl;

    @Autowired
    public EditorialNotificationService(
            AppProperties properties,
            ObjectMapper objectMapper,
            @Qualifier("rssVirtualThreadExecutor") ExecutorService virtualThreadExecutor
    ) {
        this(
                properties,
                objectMapper,
                HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(4))
                        .executor(Executors.newVirtualThreadPerTaskExecutor())
                        .build(),
                virtualThreadExecutor,
                "https://api.telegram.org"
        );
    }

    public EditorialNotificationService(
            AppProperties properties,
            ObjectMapper objectMapper,
            HttpClient httpClient,
            ExecutorService virtualThreadExecutor,
            String telegramApiBaseUrl
    ) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.virtualThreadExecutor = virtualThreadExecutor;
        this.telegramApiBaseUrl = StringUtils.hasText(telegramApiBaseUrl)
                ? telegramApiBaseUrl.replaceAll("/+$", "")
                : "https://api.telegram.org";
    }

    public void notifyNewPendingArticleAsync(PendingNotificationPayload payload) {
        if (payload == null) {
            return;
        }
        try {
            virtualThreadExecutor.submit(() -> notifyNewPendingArticle(payload));
        } catch (Exception ex) {
            log.warn("Failed to schedule async editorial notification for '{}': {}",
                    payload.headline(), ex.getMessage());
        }
    }

    public void notifyNewPendingArticle(PendingNotificationPayload payload) {
        if (payload == null) {
            return;
        }
        AppProperties.NotificationProperties cfg = properties.notifications();
        String discordUrl = cfg != null && StringUtils.hasText(cfg.discordWebhookUrl())
                ? cfg.discordWebhookUrl().trim()
                : "";
        String telegramToken = cfg != null && StringUtils.hasText(cfg.telegramBotToken())
                ? cfg.telegramBotToken().trim()
                : "";
        String telegramChatId = cfg != null && StringUtils.hasText(cfg.telegramChatId())
                ? cfg.telegramChatId().trim()
                : "";

        boolean discordEnabled = StringUtils.hasText(discordUrl);
        boolean telegramEnabled = StringUtils.hasText(telegramToken) && StringUtils.hasText(telegramChatId);

        if (!discordEnabled && !telegramEnabled) {
            log.warn("Editorial notification skipped for '{}': DISCORD_WEBHOOK_URL and TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID are not configured.",
                    payload.headline());
            return;
        }

        String adminUrl = resolveAdminUrl(cfg != null ? cfg.appWebPublicUrl() : null);
        String messageText = formatNotificationMessage(payload, adminUrl);

        if (discordEnabled) {
            sendDiscordAlertSafely(discordUrl, messageText, payload.headline());
        }
        if (telegramEnabled) {
            sendTelegramAlertSafely(telegramToken, telegramChatId, messageText, payload.headline());
        }
    }

    private void sendDiscordAlertSafely(String webhookUrl, String content, String headline) {
        try {
            String jsonBody = objectMapper.writeValueAsString(Map.of("content", content));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                log.warn("Discord webhook returned HTTP {} for pending article '{}'", status, headline);
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("Discord notification interrupted for pending article '{}'", headline);
        } catch (Exception ex) {
            log.warn("Discord notification failed for pending article '{}': {}", headline, ex.getMessage());
        }
    }

    private void sendTelegramAlertSafely(String botToken, String chatId, String text, String headline) {
        try {
            String endpoint = telegramApiBaseUrl + "/bot" + botToken + "/sendMessage";
            String jsonBody = objectMapper.writeValueAsString(Map.of(
                    "chat_id", chatId,
                    "text", text,
                    "disable_web_page_preview", false
            ));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(REQUEST_TIMEOUT)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                log.warn("Telegram Bot API returned HTTP {} for pending article '{}'", status, headline);
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("Telegram notification interrupted for pending article '{}'", headline);
        } catch (Exception ex) {
            log.warn("Telegram notification failed for pending article '{}': {}", headline, ex.getMessage());
        }
    }

    String formatNotificationMessage(PendingNotificationPayload payload, String adminUrl) {
        String categoryName = payload.category() != null ? payload.category().name() : "GAMES";
        String aiStatusName = payload.aiStatus() != null ? payload.aiStatus().name() : AiStatus.SUCCESS.name();
        List<String> sources = (payload.matchedSources() != null && !payload.matchedSources().isEmpty())
                ? payload.matchedSources()
                : List.of("Fonte RSS");
        String sourcesLabel = String.join(", ", sources);

        return "[CritHit! Fila PENDING_REVIEW]\n"
                + "Manchete: " + payload.headline() + "\n"
                + "Editoria: " + categoryName + "\n"
                + "Fonte(s): " + sourcesLabel + "\n"
                + "Status IA: " + aiStatusName + "\n"
                + "Revisar no Admin: " + adminUrl;
    }

    private String resolveAdminUrl(String configuredPublicUrl) {
        String base = StringUtils.hasText(configuredPublicUrl)
                ? configuredPublicUrl.trim().replaceAll("/+$", "")
                : DEFAULT_WEB_PUBLIC_URL;
        return base + "/admin";
    }

    public record PendingNotificationPayload(
            UUID articleId,
            String headline,
            Category category,
            List<String> matchedSources,
            AiStatus aiStatus,
            String sourceUrl
    ) {}
}
