package br.com.crithit.api.ai;

import br.com.crithit.api.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

@Component
@ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${crithit.ai.api-key:}')")
public class OpenAiEmbeddingClient implements EmbeddingClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String embeddingModel;
    private final int dimensions;

    public OpenAiEmbeddingClient(AppProperties properties, ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.embeddingModel = properties.ai().embeddingModel();
        this.dimensions = properties.ai().embeddingDimensions() > 0
                ? properties.ai().embeddingDimensions() : 1536;

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
    public float[] generateEmbedding(String text) {
        Map<String, Object> payload = Map.of(
                "model", embeddingModel,
                "input", text == null ? "" : text
        );

        try {
            String responseBody = restClient.post()
                    .uri("/embeddings")
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            JsonNode vectorNode = objectMapper.readTree(responseBody).path("data").path(0).path("embedding");
            if (!vectorNode.isArray() || vectorNode.isEmpty()) {
                throw new AiTransientException("Embedding response missing data[0].embedding array");
            }
            float[] vector = new float[dimensions];
            int limit = Math.min(dimensions, vectorNode.size());
            for (int i = 0; i < limit; i++) {
                vector[i] = (float) vectorNode.get(i).asDouble();
            }
            return vector;
        } catch (AiTransientException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AiTransientException("Failed to generate embedding: " + ex.getMessage(), ex);
        }
    }
}
