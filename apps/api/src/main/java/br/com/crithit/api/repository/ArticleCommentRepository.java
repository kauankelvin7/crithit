package br.com.crithit.api.repository;

import br.com.crithit.api.domain.entity.ArticleComment;
import br.com.crithit.api.domain.enums.CommentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ArticleCommentRepository extends JpaRepository<ArticleComment, UUID> {
    Page<ArticleComment> findByArticleIdAndStatusOrderByCreatedAtDesc(
            UUID articleId, CommentStatus status, Pageable pageable);
}
