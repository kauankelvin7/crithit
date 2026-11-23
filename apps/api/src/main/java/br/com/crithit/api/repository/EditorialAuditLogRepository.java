package br.com.crithit.api.repository;

import br.com.crithit.api.domain.entity.EditorialAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EditorialAuditLogRepository extends JpaRepository<EditorialAuditLog, UUID> {
    List<EditorialAuditLog> findByArticleIdOrderByCreatedAtDesc(UUID articleId);
}
