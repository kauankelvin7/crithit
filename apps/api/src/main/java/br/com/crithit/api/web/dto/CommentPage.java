package br.com.crithit.api.web.dto;

import java.util.List;

public record CommentPage(
        List<CommentDto> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {}
