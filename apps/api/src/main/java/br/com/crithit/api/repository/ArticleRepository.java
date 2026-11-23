package br.com.crithit.api.repository;

import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArticleRepository extends JpaRepository<Article, UUID>, JpaSpecificationExecutor<Article> {

    interface SemanticMatchProjection {
        UUID getArticleId();
        String getStatus();
        String getHeadline();
        double getSimilarityScore();
    }

    Optional<Article> findBySlugAndStatus(String slug, ArticleStatus status);

    Optional<Article> findByIdAndStatus(UUID id, ArticleStatus status);

    boolean existsBySlug(String slug);

    boolean existsByCanonicalUrlHash(String canonicalUrlHash);

    Optional<Article> findTopByStatusAndIsMainHeadlineTrueOrderByPublishedAtDesc(ArticleStatus status);

    Optional<Article> findTopByStatusOrderByPublishedAtDescCreatedAtDesc(ArticleStatus status);

    Optional<Article> findTopByStatusAndIdNotOrderByPublishedAtDescCreatedAtDesc(ArticleStatus status, UUID excludeId);

    List<Article> findByStatusOrderByPublishedAtDescCreatedAtDesc(ArticleStatus status, Pageable pageable);

    List<Article> findByStatusAndIsUrgentTrueOrderByPublishedAtDesc(ArticleStatus status, Pageable pageable);

    List<Article> findByStatusAndEditorialFormatInOrderByPublishedAtDesc(
            ArticleStatus status, Collection<EditorialFormat> formats, Pageable pageable);

    List<Article> findByStatusAndCategoryOrderByPublishedAtDesc(
            ArticleStatus status, Category category, Pageable pageable);

    List<Article> findByStatusAndCategoryAndIdNotOrderByPublishedAtDesc(
            ArticleStatus status, Category category, UUID excludeId, Pageable pageable);

    List<Article> findByStatusAndPublishedAtGreaterThanEqualOrderByViewsCountDescPublishedAtDesc(
            ArticleStatus status, Instant since, Pageable pageable);

    List<Article> findByStatusOrderByViewsCountDescPublishedAtDesc(ArticleStatus status, Pageable pageable);

    Page<Article> findByStatusOrderByPublishedAtDesc(ArticleStatus status, Pageable pageable);

    Page<Article> findPageByStatusAndCategoryOrderByPublishedAtDesc(ArticleStatus status, Category category, Pageable pageable);

    List<Article> findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(ArticleStatus status, Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Article a SET a.isMainHeadline = false WHERE a.isMainHeadline = true AND a.id <> :targetId")
    int clearOtherMainHeadlines(@Param("targetId") UUID targetId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Article a SET a.isMainHeadline = true WHERE a.id = :targetId AND a.status = br.com.crithit.api.domain.enums.ArticleStatus.PUBLISHED")
    int promoteMainHeadline(@Param("targetId") UUID targetId);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Article a SET a.viewsCount = a.viewsCount + 1 WHERE a.id = :id AND a.status = br.com.crithit.api.domain.enums.ArticleStatus.PUBLISHED")
    int incrementViewsCount(@Param("id") UUID id);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Article a SET a.likesCount = a.likesCount + 1 WHERE a.id = :id AND a.status = br.com.crithit.api.domain.enums.ArticleStatus.PUBLISHED")
    int incrementLikesCount(@Param("id") UUID id);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Article a SET a.likesCount = CASE WHEN a.likesCount > 0 THEN a.likesCount - 1 ELSE 0 END WHERE a.id = :id AND a.status = br.com.crithit.api.domain.enums.ArticleStatus.PUBLISHED")
    int decrementLikesCount(@Param("id") UUID id);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Article a SET a.savesCount = a.savesCount + 1 WHERE a.id = :id AND a.status = br.com.crithit.api.domain.enums.ArticleStatus.PUBLISHED")
    int incrementSavesCount(@Param("id") UUID id);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Article a SET a.savesCount = CASE WHEN a.savesCount > 0 THEN a.savesCount - 1 ELSE 0 END WHERE a.id = :id AND a.status = br.com.crithit.api.domain.enums.ArticleStatus.PUBLISHED")
    int decrementSavesCount(@Param("id") UUID id);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE Article a SET a.commentsCount = a.commentsCount + 1 WHERE a.id = :id AND a.status = br.com.crithit.api.domain.enums.ArticleStatus.PUBLISHED")
    int incrementCommentsCount(@Param("id") UUID id);

    @Query(value = """
            SELECT a.id AS articleId,
                   a.status AS status,
                   a.headline AS headline,
                   (1.0 - (a.embedding <=> CAST(:candidateEmbedding AS vector))) AS similarityScore
            FROM articles a
            WHERE a.embedding IS NOT NULL
              AND a.created_at >= :cutoff
              AND a.status IN ('PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'DISCARDED')
              AND (1.0 - (a.embedding <=> CAST(:candidateEmbedding AS vector))) >= :threshold
            ORDER BY a.embedding <=> CAST(:candidateEmbedding AS vector) ASC
            LIMIT 1
            """, nativeQuery = true)
    Optional<SemanticMatchProjection> findBestSemanticMatch(
            @Param("candidateEmbedding") String candidateEmbedding,
            @Param("cutoff") Instant cutoff,
            @Param("threshold") double threshold
    );
}
