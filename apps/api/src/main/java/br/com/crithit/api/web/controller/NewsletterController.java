package br.com.crithit.api.web.controller;

import br.com.crithit.api.security.VisitorIdentityResolver;
import br.com.crithit.api.service.NewsletterService;
import br.com.crithit.api.web.dto.NewsletterSubscribeRequest;
import br.com.crithit.api.web.dto.NewsletterSubscribeResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/newsletter")
public class NewsletterController {

    private final NewsletterService newsletterService;
    private final VisitorIdentityResolver visitorIdentityResolver;

    public NewsletterController(
            NewsletterService newsletterService,
            VisitorIdentityResolver visitorIdentityResolver
    ) {
        this.newsletterService = newsletterService;
        this.visitorIdentityResolver = visitorIdentityResolver;
    }

    @PostMapping("/subscribe")
    public ResponseEntity<NewsletterSubscribeResponse> subscribe(
            @Valid @RequestBody NewsletterSubscribeRequest requestBody,
            HttpServletRequest request
    ) {
        String ipHash = visitorIdentityResolver.hashIp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(newsletterService.subscribe(requestBody, ipHash));
    }
}
