package br.com.crithit.api.web.controller;

import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.security.RateLimitService;
import br.com.crithit.api.security.VisitorIdentityResolver;
import br.com.crithit.api.service.PublicFeedService;
import br.com.crithit.api.web.dto.HomeResponse;
import br.com.crithit.api.web.dto.PublicArticleDetail;
import br.com.crithit.api.web.dto.PublicArticlePage;
import br.com.crithit.api.web.dto.ReelsFeedResponse;
import br.com.crithit.api.web.exception.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1")
public class PublicFeedController {

    private final PublicFeedService feedService;
    private final VisitorIdentityResolver visitorIdentityResolver;
    private final RateLimitService rateLimitService;

    public PublicFeedController(
            PublicFeedService feedService,
            VisitorIdentityResolver visitorIdentityResolver,
            RateLimitService rateLimitService
    ) {
        this.feedService = feedService;
        this.visitorIdentityResolver = visitorIdentityResolver;
        this.rateLimitService = rateLimitService;
    }

    @GetMapping("/home")
    public ResponseEntity<HomeResponse> getHome() {
        return ResponseEntity.ok(feedService.getHome());
    }

    @GetMapping("/articles")
    public ResponseEntity<PublicArticlePage> listArticles(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) EditorialFormat format,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            HttpServletRequest request
    ) {
        if (StringUtils.hasText(q)) {
            String ipHash = visitorIdentityResolver.hashIp(request);
            if (!rateLimitService.tryConsume("search", ipHash, 60, Duration.ofMinutes(1))) {
                throw new RateLimitExceededException("Muitas buscas consecutivas. Aguarde um momento.");
            }
        }
        return ResponseEntity.ok(feedService.searchPublishedArticles(q, category, format, page, size));
    }

    @GetMapping("/articles/{slug}")
    public ResponseEntity<PublicArticleDetail> getArticleBySlug(
            @PathVariable String slug,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String visitorHash = visitorIdentityResolver.resolveVisitorHash(request, response, false);
        return ResponseEntity.ok(feedService.getPublishedArticleBySlug(slug, visitorHash));
    }

    @GetMapping("/reels")
    public ResponseEntity<ReelsFeedResponse> getReels(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String focusSlug,
            @RequestParam(required = false) String slug,
            @RequestParam(required = false) String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        String resolvedFocus = StringUtils.hasText(focusSlug) ? focusSlug
                : (StringUtils.hasText(slug) ? slug : id);
        return ResponseEntity.ok(feedService.getReelsFeed(category, resolvedFocus, page, size));
    }
}
