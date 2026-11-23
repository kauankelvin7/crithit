package br.com.crithit.api.web.dto;

import java.util.List;

public record PublicArticlePage(
        List<PublicArticleSummary> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {}
