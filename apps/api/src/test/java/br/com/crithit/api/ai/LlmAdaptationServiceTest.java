package br.com.crithit.api.ai;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.service.SlugService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LlmAdaptationServiceTest {

    @Mock
    private EditorialAiClient aiClient;
    @Mock
    private ArticleRepository articleRepository;

    private LlmAdaptationService adaptationService;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new AppProperties.CorsProperties(List.of("http://localhost:3000")),
                new AppProperties.SecurityProperties(
                        new AppProperties.SecurityProperties.JwtProperties("0123456789abcdef0123456789abcdef", "crithit", 900, 604800),
                        "salt",
                        false
                ),
                new AppProperties.AdminSeedProperties("", "", "Editor"),
                new AppProperties.AiProperties("", "https://api.openai.com/v1", "gpt-4o-mini", "text-embedding-3-small", 1536, 5000, 2),
                new AppProperties.RssProperties(false, "0 */15 * * * *", 4, 2000, 2000, 1024 * 1024, 0.82, 72, 5, 15, "CritHitBot"),
                new AppProperties.RevalidateProperties("http://localhost:3000/api/revalidate", "sec", false),
                new AppProperties.NotificationProperties("", "", "", "http://localhost:3000")
        );
        adaptationService = new LlmAdaptationService(
                aiClient,
                new HtmlSanitizer(),
                new SlugService(articleRepository),
                props
        );
    }

    @Test
    void retriesTransientErrorAndSanitizesReturnedHtml() {
        RawFeedItem item = new RawFeedItem(
                "Gematsu",
                "https://www.gematsu.com/2026/11/rpg-remake",
                Category.GAMES,
                "en",
                "Classic JRPG Remake Announced",
                "Studio reveals 2027 release window.",
                "Studio reveals 2027 release window."
        );

        LlmAdaptationResult aiPayload = new LlmAdaptationResult(
                "<b>Remake de JRPG</b> clássico ganha janela para 2027",
                List.of("<script>alert(1)</script>Lançamento confirmado para consoles"),
                "<p>O estúdio confirmou o remake completo do JRPG para 2027.</p>",
                List.of("<p>Primeiro parágrafo jornalístico limpo de tags HTML.</p>"),
                "Resumo direto para Reels sobre o remake anunciado hoje.",
                Category.GAMES,
                EditorialFormat.NEWS,
                List.of("jrpg", "games"),
                "remake-jrpg-2027",
                2,
                List.of("Nota interna")
        );

        when(aiClient.adaptArticle(item))
                .thenThrow(new AiTransientException("429 Too Many Requests"))
                .thenReturn(aiPayload);

        LlmAdaptationService.AdaptationOutcome outcome = adaptationService.adaptWithFallback(item);

        assertThat(outcome.aiStatus()).isEqualTo(AiStatus.SUCCESS);
        assertThat(outcome.result().headline()).isEqualTo("Remake de JRPG clássico ganha janela para 2027");
        assertThat(outcome.result().subheadlineBullets()).containsExactly("Lançamento confirmado para consoles");
        assertThat(outcome.result().bodyParagraphs()).containsExactly("Primeiro parágrafo jornalístico limpo de tags HTML.");
        verify(aiClient, times(2)).adaptArticle(item);
    }

    @Test
    void fallsBackSafelyToRawDraftWhenAiFailsOrReturnsIncompletePayload() {
        RawFeedItem item = new RawFeedItem(
                "Anime News Network",
                "https://www.animenewsnetwork.com/news/2026-11-23/new-season",
                Category.ANIMES,
                "en",
                "Original Sci-Fi Anime Reveals New Key Visual",
                "The production committee shared staff details and spring broadcast window.",
                "The production committee shared staff details and spring broadcast window."
        );

        when(aiClient.adaptArticle(item)).thenThrow(new AiNonRetryableException("Malformed JSON"));

        LlmAdaptationService.AdaptationOutcome outcome = adaptationService.adaptWithFallback(item);

        assertThat(outcome.aiStatus()).isEqualTo(AiStatus.FALLBACK_RAW);
        assertThat(outcome.result().headline()).isEqualTo("Original Sci-Fi Anime Reveals New Key Visual");
        assertThat(outcome.result().lead()).contains("production committee shared staff details");
        assertThat(outcome.result().category()).isEqualTo(Category.ANIMES);
        assertThat(outcome.result().editorialNotes()).anyMatch(n -> n.contains("FALLBACK_RAW"));
    }
}
