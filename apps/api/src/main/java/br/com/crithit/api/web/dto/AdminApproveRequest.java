package br.com.crithit.api.web.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;

public record AdminApproveRequest(
        @JsonAlias({"isMainHeadline", "setAsMainHeadline"})
        Boolean setAsMainHeadline,

        @Valid
        AdminArticleUpsertRequest edits
) {
    public boolean shouldSetAsMainHeadline() {
        return Boolean.TRUE.equals(setAsMainHeadline);
    }
}
