package br.com.crithit.api.repository;

import br.com.crithit.api.domain.entity.ArticleInteraction;
import br.com.crithit.api.domain.enums.InteractionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ArticleInteractionRepository extends JpaRepository<ArticleInteraction, UUID> {

    boolean existsByArticleIdAndVisitorHashAndInteractionType(
            UUID articleId, String visitorHash, InteractionType interactionType);

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM ArticleInteraction ai WHERE ai.article.id = :articleId AND ai.visitorHash = :visitorHash AND ai.interactionType = :type")
    int deleteInteraction(
            @Param("articleId") UUID articleId,
            @Param("visitorHash") String visitorHash,
            @Param("type") InteractionType type);
}
