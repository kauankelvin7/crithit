package br.com.crithit.api.web.controller;

import br.com.crithit.api.security.VisitorIdentityResolver;
import br.com.crithit.api.service.InteractionService;
import br.com.crithit.api.web.dto.CommentDto;
import br.com.crithit.api.web.dto.CommentPage;
import br.com.crithit.api.web.dto.CreateCommentRequest;
import br.com.crithit.api.web.dto.LikeToggleResponse;
import br.com.crithit.api.web.dto.SaveToggleResponse;
import br.com.crithit.api.web.dto.ViewResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/articles/{id}")
public class PublicInteractionController {

    private final InteractionService interactionService;
    private final VisitorIdentityResolver visitorIdentityResolver;

    public PublicInteractionController(
            InteractionService interactionService,
            VisitorIdentityResolver visitorIdentityResolver
    ) {
        this.interactionService = interactionService;
        this.visitorIdentityResolver = visitorIdentityResolver;
    }

    @PostMapping("/view")
    public ResponseEntity<ViewResponse> recordView(
            @PathVariable UUID id,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String visitorHash = visitorIdentityResolver.resolveVisitorHash(request, response, true);
        String ipHash = visitorIdentityResolver.hashIp(request);
        return ResponseEntity.ok(interactionService.registerView(id, visitorHash, ipHash));
    }

    @PostMapping("/like")
    public ResponseEntity<LikeToggleResponse> toggleLike(
            @PathVariable UUID id,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String visitorHash = visitorIdentityResolver.resolveVisitorHash(request, response, true);
        String ipHash = visitorIdentityResolver.hashIp(request);
        return ResponseEntity.ok(interactionService.toggleLike(id, visitorHash, ipHash));
    }

    @PostMapping("/save")
    public ResponseEntity<SaveToggleResponse> toggleSave(
            @PathVariable UUID id,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String visitorHash = visitorIdentityResolver.resolveVisitorHash(request, response, true);
        String ipHash = visitorIdentityResolver.hashIp(request);
        return ResponseEntity.ok(interactionService.toggleSave(id, visitorHash, ipHash));
    }

    @GetMapping("/comments")
    public ResponseEntity<CommentPage> listComments(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(interactionService.listComments(id, page, size));
    }

    @PostMapping("/comments")
    public ResponseEntity<CommentDto> createComment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommentRequest body,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String visitorHash = visitorIdentityResolver.resolveVisitorHash(request, response, true);
        String ipHash = visitorIdentityResolver.hashIp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interactionService.createComment(id, body, visitorHash, ipHash));
    }
}
