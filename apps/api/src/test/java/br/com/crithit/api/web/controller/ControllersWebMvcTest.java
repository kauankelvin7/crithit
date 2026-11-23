package br.com.crithit.api.web.controller;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.config.SecurityConfig;
import br.com.crithit.api.domain.entity.User;
import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.domain.enums.UserRole;
import br.com.crithit.api.security.JwtAuthenticationFilter;
import br.com.crithit.api.security.JwtBlacklistService;
import br.com.crithit.api.security.JwtService;
import br.com.crithit.api.security.RateLimitService;
import br.com.crithit.api.security.VisitorIdentityResolver;
import br.com.crithit.api.service.AdminArticleService;
import br.com.crithit.api.service.AdminRssSourceService;
import br.com.crithit.api.service.PublicFeedService;
import br.com.crithit.api.web.dto.AdminArticleDetail;
import br.com.crithit.api.web.dto.AdminArticlePage;
import br.com.crithit.api.web.dto.AttributionInfo;
import br.com.crithit.api.web.dto.HomeResponse;
import br.com.crithit.api.web.dto.PublicArticleSummary;
import br.com.crithit.api.web.dto.ReelsFeedResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        PublicFeedController.class,
        AdminArticleController.class,
        AdminRssSourceController.class
})
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtService.class,
        ControllersWebMvcTest.TestConfig.class
})
class ControllersWebMvcTest {

    @TestConfiguration
    @EnableConfigurationProperties(AppProperties.class)
    static class TestConfig {
        @Bean
        VisitorIdentityResolver visitorIdentityResolver(AppProperties props) {
            return new VisitorIdentityResolver(props);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private JwtBlacklistService jwtBlacklistService;
    @MockitoBean
    private RateLimitService rateLimitService;
    @MockitoBean
    private PublicFeedService publicFeedService;
    @MockitoBean
    private AdminArticleService adminArticleService;
    @MockitoBean
    private AdminRssSourceService adminRssSourceService;

    @Test
    void adminEndpointsRejectUnauthenticatedRequestsWith401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/articles"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void adminEndpointsAcceptValidJwtAndBlockJavascriptSourceUrl() throws Exception {
        String token = validAdminToken();
        when(jwtBlacklistService.isRevoked(any())).thenReturn(false);
        when(adminArticleService.listArticles(any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new AdminArticlePage(List.of(), 0, 20, 0, 0));

        mockMvc.perform(get("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        String invalidPayload = """
                {
                  "headline": "Notícia válida sobre lançamento de RPG",
                  "subheadlineBullets": ["Detalhe 1"],
                  "lead": "Lead completo com mais de vinte caracteres para passar na validação de tamanho.",
                  "bodyParagraphs": ["Primeiro parágrafo completo da notícia."],
                  "reelsSummary": "Resumo curto para Reels com mais de vinte caracteres.",
                  "category": "GAMES",
                  "editorialFormat": "NEWS",
                  "authorName": "Redação CritHit!",
                  "contentType": "CURADORIA",
                  "sourceName": "IGN",
                  "sourceUrl": "javascript:alert(1)"
                }
                """;

        mockMvc.perform(post("/api/v1/admin/articles")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("sourceUrl"));
    }

    @Test
    void adminApproveEndpointPublishesWithValidJwt() throws Exception {
        String token = validAdminToken();
        UUID id = UUID.randomUUID();
        when(jwtBlacklistService.isRevoked(any())).thenReturn(false);
        when(adminArticleService.approveAndPublish(eq(id), any(), any()))
                .thenReturn(sampleAdminDetail(id, ArticleStatus.PUBLISHED));

        mockMvc.perform(post("/api/v1/admin/articles/{id}/approve", id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"setAsMainHeadline\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.isMainHeadline").value(true));
    }

    @Test
    void publicHomeAndReelsEndpointsAreAccessibleWithoutAuth() throws Exception {
        when(publicFeedService.getHome()).thenReturn(new HomeResponse(
                List.of(),
                null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                Map.of(),
                List.of(),
                Instant.now()
        ));
        PublicArticleSummary animeReel = new PublicArticleSummary(
                UUID.randomUUID(),
                "frieren-s2",
                Category.ANIMES,
                EditorialFormat.NEWS,
                "Segunda temporada de Frieren ganha data",
                List.of("Estúdio Madhouse retorna"),
                "Lead completo sobre o retorno do anime.",
                "Resumo para Reels de Frieren.",
                List.of("animes"),
                null,
                Category.ANIMES.defaultCoverArtKey(),
                2,
                null,
                false,
                false,
                10L, 2L, 1L, 0L,
                Instant.now(),
                new AttributionInfo("Redação CritHit!", ContentType.CURADORIA, "Anime News Network", "https://www.animenewsnetwork.com")
        );
        when(publicFeedService.getReelsFeed(eq(Category.ANIMES), eq("frieren-s2"), eq(0), eq(15)))
                .thenReturn(new ReelsFeedResponse(List.of(animeReel), 0, 15, 1L, false, true));

        mockMvc.perform(get("/api/v1/home"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/reels")
                        .param("category", "ANIMES")
                        .param("slug", "frieren-s2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.focusSlugFound").value(true))
                .andExpect(jsonPath("$.items[0].category").value("ANIMES"));
    }

    private String validAdminToken() {
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("admin@crithit.com.br");
        u.setDisplayName("Editor-Chefe");
        u.setRole(UserRole.ROLE_ADMIN);
        return jwtService.generateAccessToken(u);
    }

    private AdminArticleDetail sampleAdminDetail(UUID id, ArticleStatus status) {
        return new AdminArticleDetail(
                id,
                "materia-aprovada",
                Category.GAMES,
                EditorialFormat.NEWS,
                "Matéria aprovada",
                List.of("Bullet 1"),
                "Lead completo editorial com mais de vinte caracteres.",
                List.of("Parágrafo 1"),
                "Resumo Reels com mais de vinte caracteres.",
                List.of("games"),
                null,
                Category.GAMES.defaultCoverArtKey(),
                2,
                null,
                true,
                false,
                0L, 0L, 0L, 0L,
                Instant.now(),
                new AttributionInfo("Redação CritHit!", ContentType.CURADORIA, "IGN", "https://www.ign.com"),
                status,
                AiStatus.SUCCESS,
                null,
                null,
                null,
                Instant.now(),
                Instant.now(),
                1L,
                "Raw Title",
                "Raw Excerpt",
                List.of(),
                List.of()
        );
    }
}
