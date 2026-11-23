package br.com.crithit.api.repository;

import br.com.crithit.api.domain.entity.ArticleSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ArticleSourceRepository extends JpaRepository<ArticleSource, UUID> {
    boolean existsByCanonicalUrlHash(String canonicalUrlHash);
    List<ArticleSource> findByArticleIdOrderByFetchedAtDesc(UUID articleId);
    long countByArticleId(UUID articleId);

    @Query("SELECT s.article.id AS articleId, COUNT(s.id) AS total FROM ArticleSource s WHERE s.article.id IN :articleIds GROUP BY s.article.id")
    List<ArticleSourceCount> countByArticleIdIn(@Param("articleIds") Collection<UUID> articleIds);

    interface ArticleSourceCount {
        UUID getArticleId();
        long getTotal();
    }
}
