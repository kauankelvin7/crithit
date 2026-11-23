package br.com.crithit.api.ai;

import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record LlmAdaptationResult(
        String headline,
        @JsonProperty("subheadline_bullets") List<String> subheadlineBullets,
        String lead,
        @JsonProperty("body_paragraphs") List<String> bodyParagraphs,
        @JsonProperty("reels_summary") String reelsSummary,
        Category category,
        @JsonProperty("editorial_format") EditorialFormat editorialFormat,
        List<String> tags,
        @JsonProperty("suggested_slug") String suggestedSlug,
        @JsonProperty("reading_time_minutes") Integer readingTimeMinutes,
        @JsonProperty("editorial_notes") List<String> editorialNotes
) {}
