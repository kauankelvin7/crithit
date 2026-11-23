package br.com.crithit.api.ai;

import br.com.crithit.api.config.AppProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Deterministic L2-normalized embedding generator active when AI_API_KEY is empty.
 * Uses unigram + bigram feature hashing so semantically overlapping news items yield high cosine similarity.
 */
@Component
@ConditionalOnMissingBean(EmbeddingClient.class)
public class DeterministicEmbeddingClient implements EmbeddingClient {

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\s]");
    private final int dimensions;

    public DeterministicEmbeddingClient(AppProperties properties) {
        this.dimensions = properties.ai().embeddingDimensions() > 0
                ? properties.ai().embeddingDimensions() : 1536;
    }

    @Override
    public float[] generateEmbedding(String text) {
        float[] vector = new float[dimensions];
        if (text == null || text.isBlank()) {
            vector[0] = 1.0f;
            return vector;
        }

        String normalized = Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        normalized = NON_ALNUM.matcher(normalized).replaceAll(" ").trim();

        String[] tokens = normalized.split("\\s+");
        for (int i = 0; i < tokens.length; i++) {
            String token = tokens[i];
            if (token.length() < 2) {
                continue;
            }
            addFeature(vector, "u:" + token, 1.0f);
            if (i + 1 < tokens.length && tokens[i + 1].length() >= 2) {
                addFeature(vector, "b:" + token + "_" + tokens[i + 1], 0.75f);
            }
        }

        double normSq = 0.0;
        for (float v : vector) {
            normSq += (double) v * v;
        }
        if (normSq == 0.0) {
            vector[0] = 1.0f;
            return vector;
        }
        float norm = (float) Math.sqrt(normSq);
        for (int i = 0; i < vector.length; i++) {
            vector[i] /= norm;
        }
        return vector;
    }

    private void addFeature(float[] vector, String feature, float weight) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(feature.getBytes(StandardCharsets.UTF_8));
            int bucketRaw = ((digest[0] & 0xFF) << 24)
                    | ((digest[1] & 0xFF) << 16)
                    | ((digest[2] & 0xFF) << 8)
                    | (digest[3] & 0xFF);
            int idx = Math.floorMod(bucketRaw, dimensions);
            float sign = (digest[4] & 1) == 0 ? 1.0f : -1.0f;
            vector[idx] += sign * weight;
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
}
