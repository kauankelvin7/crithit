package br.com.crithit.api.service;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.service.EditorialNotificationService.PendingNotificationPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EditorialNotificationServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void sendsDiscordWebhookNotificationWithHeadlineCategorySourcesAiStatusAndAdminUrl() throws Exception {
        AppProperties props = buildProps(
                "https://discord.com/api/webhooks/12345/abcdef",
                "",
                "",
                "https://crithit.com.br"
        );
        EditorialNotificationService service = new EditorialNotificationService(
                props, objectMapper, httpClient, Executors.newVirtualThreadPerTaskExecutor(), "https://api.telegram.org"
        );

        when(httpResponse.statusCode()).thenReturn(204);
        when(httpClient.<String>send(any(HttpRequest.class), any())).thenReturn(httpResponse);

        PendingNotificationPayload payload = new PendingNotificationPayload(
                UUID.randomUUID(),
                "GTA VI ganha novo trailer com gameplay inédito",
                Category.GAMES,
                List.of("IGN", "Omelete"),
                AiStatus.SUCCESS,
                "https://www.ign.com/articles/gta-6"
        );

        service.notifyNewPendingArticle(payload);

        ArgumentCaptor<HttpRequest> requestCaptor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient, times(1)).send(requestCaptor.capture(), any());
        assertThat(requestCaptor.getValue().uri().toString())
                .isEqualTo("https://discord.com/api/webhooks/12345/abcdef");

        String formatted = service.formatNotificationMessage(payload, "https://crithit.com.br/admin");
        assertThat(formatted)
                .contains("GTA VI ganha novo trailer com gameplay inédito")
                .contains("GAMES")
                .contains("IGN, Omelete")
                .contains("SUCCESS")
                .contains("https://crithit.com.br/admin");
    }

    @Test
    void sendsTelegramBotNotificationWhenTokenAndChatIdConfigured() throws Exception {
        AppProperties props = buildProps(
                "",
                "999888:ABC-DEF",
                "-100123456789",
                "http://localhost:3000"
        );
        EditorialNotificationService service = new EditorialNotificationService(
                props, objectMapper, httpClient, Executors.newVirtualThreadPerTaskExecutor(), "https://api.telegram.org"
        );

        when(httpResponse.statusCode()).thenReturn(200);
        when(httpClient.<String>send(any(HttpRequest.class), any())).thenReturn(httpResponse);

        PendingNotificationPayload payload = new PendingNotificationPayload(
                UUID.randomUUID(),
                "Novo arco de anime anunciado com fallback bruto",
                Category.ANIMES,
                List.of("Anime News Network"),
                AiStatus.FALLBACK_RAW,
                "https://www.animenewsnetwork.com/news/1"
        );

        service.notifyNewPendingArticle(payload);

        ArgumentCaptor<HttpRequest> requestCaptor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient, times(1)).send(requestCaptor.capture(), any());
        assertThat(requestCaptor.getValue().uri().toString())
                .isEqualTo("https://api.telegram.org/bot999888:ABC-DEF/sendMessage");
    }

    @Test
    void doesNotCallHttpClientWhenDisabledWithoutEnvVars() throws Exception {
        AppProperties props = buildProps("", "", "", "http://localhost:3000");
        EditorialNotificationService service = new EditorialNotificationService(
                props, objectMapper, httpClient, Executors.newVirtualThreadPerTaskExecutor(), "https://api.telegram.org"
        );

        PendingNotificationPayload payload = new PendingNotificationPayload(
                UUID.randomUUID(),
                "Pauta sem webhooks configurados",
                Category.TECH,
                List.of("Voxel"),
                AiStatus.SUCCESS,
                "https://www.tecmundo.com.br/voxel/1"
        );

        assertThatCode(() -> service.notifyNewPendingArticle(payload)).doesNotThrowAnyException();
        verify(httpClient, never()).send(any(), any());
    }

    @Test
    void swallowsHttpErrorsAndExceptionsWithoutFailingIngestion() throws Exception {
        AppProperties props = buildProps(
                "https://discord.com/api/webhooks/fail",
                "token123",
                "chat456",
                "http://localhost:3000"
        );
        EditorialNotificationService service = new EditorialNotificationService(
                props, objectMapper, httpClient, Executors.newVirtualThreadPerTaskExecutor(), "https://api.telegram.org"
        );

        when(httpClient.<String>send(any(HttpRequest.class), any()))
                .thenThrow(new IOException("Connection timed out"))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(500);

        PendingNotificationPayload payload = new PendingNotificationPayload(
                UUID.randomUUID(),
                "Pauta resiliente a falhas de rede no Discord e Telegram",
                Category.CINEMA,
                List.of("Variety"),
                AiStatus.FALLBACK_RAW,
                "https://variety.com/2026/film/1"
        );

        assertThatCode(() -> service.notifyNewPendingArticle(payload)).doesNotThrowAnyException();
        verify(httpClient, times(2)).send(any(HttpRequest.class), any());
    }

    private AppProperties buildProps(
            String discordWebhookUrl,
            String telegramBotToken,
            String telegramChatId,
            String appWebPublicUrl
    ) {
        return new AppProperties(
                new AppProperties.CorsProperties(List.of("http://localhost:3000")),
                new AppProperties.SecurityProperties(
                        new AppProperties.SecurityProperties.JwtProperties("0123456789abcdef0123456789abcdef", "crithit", 900, 604800),
                        "salt",
                        false
                ),
                new AppProperties.AdminSeedProperties("", "", "Editor"),
                new AppProperties.AiProperties("", "https://api.openai.com/v1", "gpt-4o-mini", "text-embedding-3-small", 1536, 5000, 1),
                new AppProperties.RssProperties(false, "0 */15 * * * *", 4, 2000, 2000, 1024 * 1024, 0.82, 72, 5, 15, "CritHitBot"),
                new AppProperties.RevalidateProperties("http://localhost:3000/api/revalidate", "sec", false),
                new AppProperties.NotificationProperties(discordWebhookUrl, telegramBotToken, telegramChatId, appWebPublicUrl)
        );
    }
}
