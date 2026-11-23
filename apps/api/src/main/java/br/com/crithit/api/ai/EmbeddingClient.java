package br.com.crithit.api.ai;

public interface EmbeddingClient {
    float[] generateEmbedding(String text);
}
