package br.com.crithit.api.ai;

public interface EditorialAiClient {
    LlmAdaptationResult adaptArticle(RawFeedItem item);
}
