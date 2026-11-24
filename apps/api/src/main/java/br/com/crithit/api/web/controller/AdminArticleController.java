package br.com.crithit.api.web.controller;

import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.security.JwtAuthenticationFilter.AuthenticatedEditor;
import br.com.crithit.api.service.AdminArticleService;
import br.com.crithit.api.web.dto.AdminApproveRequest;
import br.com.crithit.api.web.dto.AdminArticleDetail;
import br.com.crithit.api.web.dto.AdminArticlePage;
import br.com.crithit.api.web.dto.AdminArticleUpsertRequest;
import br.com.crithit.api.web.dto.ReasonRequest;
import br.com.crithit.api.web.dto.ScheduleArticleRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/articles")
public class AdminArticleController {

    private final AdminArticleService adminArticleService;

    public AdminArticleController(AdminArticleService adminArticleService) {
        this.adminArticleService = adminArticleService;
    }

    @GetMapping
    public ResponseEntity<AdminArticlePage> listArticles(
            @RequestParam(required = false) ArticleStatus status,
            @RequestParam(required = false) AiStatus aiStatus,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminArticleService.listArticles(status, aiStatus, category, q, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminArticleDetail> getArticle(@PathVariable UUID id) {
        return ResponseEntity.ok(adminArticleService.getArticle(id));
    }

    @PostMapping
    public ResponseEntity<AdminArticleDetail> createManualArticle(
            @Valid @RequestBody AdminArticleUpsertRequest body,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminArticleService.createManualArticle(body, actorId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminArticleDetail> updateArticle(
            @PathVariable UUID id,
            @Valid @RequestBody AdminArticleUpsertRequest body,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.ok(adminArticleService.updateArticle(id, body, actorId));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<AdminArticleDetail> approveAndPublish(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) AdminApproveRequest body,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.ok(adminArticleService.approveAndPublish(id, body, actorId));
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<AdminArticleDetail> scheduleArticle(
            @PathVariable UUID id,
            @Valid @RequestBody ScheduleArticleRequest body,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.ok(adminArticleService.scheduleArticle(id, body, actorId));
    }

    @PostMapping("/{id}/discard")
    public ResponseEntity<AdminArticleDetail> discardArticle(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) ReasonRequest body,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.ok(adminArticleService.discardArticle(id, body, actorId));
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<AdminArticleDetail> unpublishArticle(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) ReasonRequest body,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.ok(adminArticleService.unpublishArticle(id, body, actorId));
    }

    @PostMapping("/{id}/republish")
    public ResponseEntity<AdminArticleDetail> republishArticle(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.ok(adminArticleService.republishArticle(id, actorId));
    }

    @RequestMapping(value = "/{id}/main-headline", method = {RequestMethod.PATCH, RequestMethod.POST})
    public ResponseEntity<AdminArticleDetail> setMainHeadline(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedEditor editor
    ) {
        UUID actorId = editor != null ? editor.userId() : null;
        return ResponseEntity.ok(adminArticleService.setMainHeadline(id, actorId));
    }
}
