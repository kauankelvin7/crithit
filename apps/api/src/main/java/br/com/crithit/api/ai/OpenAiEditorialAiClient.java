package br.com.crithit.api.ai;

import br.com.crithit.api.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${crithit.ai.api-key:}')")
public class OpenAiEditorialAiClient implements EditorialAiClient {

    private static final String SYSTEM_PROMPT = """
            Você é o editor-assistente do portal jornalístico geek CritHit! (PT-BR).
            Regras inegociáveis:
            1. Adapte o conteúdo para português do Brasil natural e jornalístico, sem clickbait e sem jargão robótico.
            2. Fidelidade estrita aos fatos informados pela fonte original: nunca invente datas, números, citações ou declarações.
            3. Retorne EXCLUSIVAMENTE JSON válido conforme o schema abaixo:
            {
              "headline": "Manchete direta em PT-BR (max 110 chars)",
              "subheadline_bullets": ["Ponto factual 1", "Ponto factual 2"],
              "lead": "Primeiro parágrafo respondendo o que, quem, quando e impacto (180 a 320 chars)",
              "body_paragraphs": ["Parágrafo 1...", "Parágrafo 2..."],
              "reels_summary": "Resumo direto de 180 a 260 chars para leitura vertical 9:16",
              "category": "GAMES | COMICS | CINEMA | ANIMES | TECH",
              "editorial_format": "NEWS | COLUMN | REVIEW",
              "tags": ["tag-1", "tag-2", "tag-3"],
              "suggested_slug": "manchete-em-kebab-case-sem-acentos",
              "reading_time_minutes": 2,
              "editorial_notes": ["Observação para o revisor humano"]
            }
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String model;

    public OpenAiEditorialAiClient(AppProperties properties, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.model = properties.ai().model();
        Duration timeout = Duration.ofMillis(Math.max(5000L, properties.ai().timeoutMs()));
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);

        this.restClient = RestClient.builder()
                .baseUrl(properties.ai().baseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.ai().apiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public LlmAdaptationResult adaptArticle(RawFeedItem item) {
        String userPrompt = String.format(
                "Fonte: %s%nIdioma original: %s%nEditoria sugerida: %s%nTítulo original: %s%nResumo/Texto original:%n%s",
                item.sourceName(),
                item.language(),
                item.defaultCategory().name(),
                item.rawTitle(),
                item.fullText() != null && !item.fullText().isBlank() ? item.fullText() : item.rawExcerpt()
        );

        Map<String, Object> payload = Map.of(
                "model", model,
                "temperature", 0.3,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        try {
            String responseBody = restClient.post()
                    .uri("/chat/completions")
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                throw new AiTransientException("Empty response from LLM provider");
            }
            JsonNode root = objectMapper.readTree(responseBody);
            String content = root.path("choices").path(0).path("message").path("content").asText(null);
            if (content == null || content.isBlank()) {
                throw new AiNonRetryableException("LLM response missing choices[0].message.content");
            }
            String cleanJson = stripMarkdownCodeFences(content);
            return objectMapper.readValue(cleanJson, LlmAdaptationResult.class);
        } catch (HttpClientErrorException ex) {
            int status = ex.getStatusCode().value();
            if (status == 429) {
                throw new AiTransientException("LLM rate limited (429)", ex);
            }
            throw new AiNonRetryableException("LLM client error (" + status + "): " + ex.getMessage(), ex);
        } catch (HttpServerErrorException | ResourceAccessException ex) {
            throw new AiTransientException("Transient LLM provider failure: " + ex.getMessage(), ex);
        } catch (AiTransientException | AiNonRetryableException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AiNonRetryableException("Invalid JSON returned by LLM: " + ex.getMessage(), ex);
        }
    }

    private String stripMarkdownCodeFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > 0) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }
}
