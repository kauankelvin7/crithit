package br.com.crithit.api.web.controller;

import br.com.crithit.api.security.JwtAuthenticationFilter;
import br.com.crithit.api.security.VisitorIdentityResolver;
import br.com.crithit.api.service.AdminAuthService;
import br.com.crithit.api.web.dto.AdminUserDto;
import br.com.crithit.api.web.dto.AuthTokenResponse;
import br.com.crithit.api.web.dto.LoginRequest;
import br.com.crithit.api.web.dto.RefreshTokenRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/auth")
public class AdminAuthController {

    private final AdminAuthService authService;
    private final VisitorIdentityResolver visitorIdentityResolver;

    public AdminAuthController(
            AdminAuthService authService,
            VisitorIdentityResolver visitorIdentityResolver
    ) {
        this.authService = authService;
        this.visitorIdentityResolver = visitorIdentityResolver;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthTokenResponse> login(
            @Valid @RequestBody LoginRequest body,
            HttpServletRequest request
    ) {
        String clientIp = visitorIdentityResolver.resolveClientIp(request);
        return ResponseEntity.ok(authService.login(body, clientIp));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthTokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest body) {
        return ResponseEntity.ok(authService.refresh(body));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal JwtAuthenticationFilter.AuthenticatedEditor editor
    ) {
        authService.logout(editor);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AdminUserDto> me(
            @AuthenticationPrincipal JwtAuthenticationFilter.AuthenticatedEditor editor
    ) {
        return ResponseEntity.ok(authService.getCurrentUser(editor));
    }
}
