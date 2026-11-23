package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.ArticleSource;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.web.dto.AdminArticleDetail;
import br.com.crithit.api.web.dto.AdminArticleSummary;
import br.com.crithit.api.web.dto.AttributionInfo;
import br.com.crithit.api.web.dto.MatchedSourceDto;
import br.com.crithit.api.web.dto.PublicArticleDetail;
import br.com.crithit.api.web.dto.PublicArticleSummary;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ArticleMapper {

    public AttributionInfo toAttribution(Article article) {
        return new AttributionInfo(
                article.getAuthorName(),
                article.getContentType(),
                article.getSourceName(),
                article.getSourceUrl()
        );
    }

    public PublicArticleSummary toPublicSummary(Article a) {
        return new PublicArticleSummary(
                a.getId(),
                a.getSlug(),
                a.getCategory(),
                a.getEditorialFormat(),
                a.getHeadline(),
                List.copyOf(a.getSubheadlineBullets()),
                a.getLead(),
                a.getReelsSummary(),
                List.copyOf(a.getTags()),
                a.getCoverImageUrl(),
                a.getCoverArtKey(),
                a.getReadingTimeMinutes(),
                a.getReviewScore(),
                a.isMainHeadline(),
                a.isUrgent(),
                a.getViewsCount(),
                a.getLikesCount(),
                a.getSavesCount(),
                a.getCommentsCount(),
                a.getPublishedAt(),
                toAttribution(a)
        );
    }

    public PublicArticleDetail toPublicDetail(
            Article a,
            List<ArticleSource> sources,
            List<Article> related,
            boolean liked,
            boolean saved
    ) {
        String transparencyNote = a.getContentType() == ContentType.CURADORIA
                ? "Nota de Transparência: Texto adaptado a partir da fonte citada ("
                  + a.getSourceName()
                  + "), com apoio de ferramenta de IA e revisão editorial humana do CritHit! antes da publicação."
                : null;

        return new PublicArticleDetail(
                a.getId(),
                a.getSlug(),
                a.getCategory(),
                a.getEditorialFormat(),
                a.getHeadline(),
                List.copyOf(a.getSubheadlineBullets()),
                a.getLead(),
                List.copyOf(a.getBodyParagraphs()),
                a.getReelsSummary(),
                List.copyOf(a.getTags()),
                a.getCoverImageUrl(),
                a.getCoverArtKey(),
                a.getReadingTimeMinutes(),
                a.getReviewScore(),
                a.isMainHeadline(),
                a.isUrgent(),
                a.getViewsCount(),
                a.getLikesCount(),
                a.getSavesCount(),
                a.getCommentsCount(),
                a.getPublishedAt(),
                toAttribution(a),
                transparencyNote,
                sources.stream().map(this::toMatchedSourceDto).toList(),
                related.stream().map(this::toPublicSummary).toList(),
                new PublicArticleDetail.ViewerState(liked, saved)
        );
    }

    public AdminArticleSummary toAdminSummary(Article a, long matchedSourcesCount) {
        return new AdminArticleSummary(
                a.getId(),
                a.getSlug(),
                a.getCategory(),
                a.getEditorialFormat(),
                a.getHeadline(),
                List.copyOf(a.getSubheadlineBullets()),
                a.getLead(),
                a.getReelsSummary(),
                List.copyOf(a.getTags()),
                a.getCoverImageUrl(),
                a.getCoverArtKey(),
                a.getReadingTimeMinutes(),
                a.getReviewScore(),
                a.isMainHeadline(),
                a.isUrgent(),
                a.getViewsCount(),
                a.getLikesCount(),
                a.getSavesCount(),
                a.getCommentsCount(),
                a.getPublishedAt(),
                toAttribution(a),
                a.getStatus(),
                a.getAiStatus(),
                a.getScheduledAt(),
                a.getUnpublishedAt(),
                a.getDiscardedAt(),
                a.getCreatedAt(),
                a.getUpdatedAt(),
                matchedSourcesCount
        );
    }

    public AdminArticleDetail toAdminDetail(Article a, List<ArticleSource> sources) {
        return new AdminArticleDetail(
                a.getId(),
                a.getSlug(),
                a.getCategory(),
                a.getEditorialFormat(),
                a.getHeadline(),
                List.copyOf(a.getSubheadlineBullets()),
                a.getLead(),
                List.copyOf(a.getBodyParagraphs()),
                a.getReelsSummary(),
                List.copyOf(a.getTags()),
                a.getCoverImageUrl(),
                a.getCoverArtKey(),
                a.getReadingTimeMinutes(),
                a.getReviewScore(),
                a.isMainHeadline(),
                a.isUrgent(),
                a.getViewsCount(),
                a.getLikesCount(),
                a.getSavesCount(),
                a.getCommentsCount(),
                a.getPublishedAt(),
                toAttribution(a),
                a.getStatus(),
                a.getAiStatus(),
                a.getScheduledAt(),
                a.getUnpublishedAt(),
                a.getDiscardedAt(),
                a.getCreatedAt(),
                a.getUpdatedAt(),
                sources.size(),
                a.getRawTitle(),
                a.getRawExcerpt(),
                List.copyOf(a.getEditorialNotes()),
                sources.stream().map(this::toMatchedSourceDto).toList()
        );
    }

    public MatchedSourceDto toMatchedSourceDto(ArticleSource s) {
        return new MatchedSourceDto(
                s.getId(),
                s.getSourceName(),
                s.getSourceUrl(),
                s.getOriginalTitle(),
                s.getOriginalExcerpt(),
                s.getSimilarityScore(),
                s.isPrimary(),
                s.getFetchedAt()
        );
    }
}
