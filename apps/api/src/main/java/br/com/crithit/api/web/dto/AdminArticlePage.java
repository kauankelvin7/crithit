package br.com.crithit.api.web.dto;

import java.util.List;

public record AdminArticlePage(
        List<AdminArticleSummary> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {}
