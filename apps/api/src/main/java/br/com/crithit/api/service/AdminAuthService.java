package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.User;
import br.com.crithit.api.repository.UserRepository;
import br.com.crithit.api.security.JwtAuthenticationFilter;
import br.com.crithit.api.security.JwtBlacklistService;
import br.com.crithit.api.security.JwtService;
import br.com.crithit.api.security.RateLimitService;
import br.com.crithit.api.web.dto.AdminUserDto;
import br.com.crithit.api.web.dto.AuthTokenResponse;
import br.com.crithit.api.web.dto.LoginRequest;
import br.com.crithit.api.web.dto.RefreshTokenRequest;
import br.com.crithit.api.web.exception.RateLimitExceededException;
import br.com.crithit.api.web.exception.UnauthorizedException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AdminAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtBlacklistService blacklistService;
    private final RateLimitService rateLimitService;

    public AdminAuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtBlacklistService blacklistService,
            RateLimitService rateLimitService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.blacklistService = blacklistService;
        this.rateLimitService = rateLimitService;
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request, String clientIp) {
        if (!rateLimitService.tryConsume("login", clientIp, 5, Duration.ofMinutes(5))) {
            throw new RateLimitExceededException("Muitas tentativas de login. Aguarde alguns minutos.");
        }

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(User::isActive)
                .orElseThrow(() -> new UnauthorizedException("Credenciais inválidas"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Credenciais inválidas");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return issueTokens(user);
    }

    @Transactional(readOnly = true)
    public AuthTokenResponse refresh(RefreshTokenRequest request) {
        try {
            Claims claims = jwtService.parseAndValidate(request.refreshToken(), JwtService.TOKEN_TYPE_REFRESH);
            if (blacklistService.isRevoked(claims.getId())) {
                throw new UnauthorizedException("Refresh token revogado");
            }
            UUID userId = UUID.fromString(claims.getSubject());
            User user = userRepository.findById(userId)
                    .filter(User::isActive)
                    .orElseThrow(() -> new UnauthorizedException("Usuário editorial inválido ou inativo"));

            // Rotate refresh token by blacklisting the old jti
            blacklistService.revoke(claims.getId(), claims.getExpiration().toInstant());
            return issueTokens(user);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new UnauthorizedException("Refresh token inválido ou expirado");
        }
    }

    public void logout(JwtAuthenticationFilter.AuthenticatedEditor editor) {
        if (editor != null) {
            blacklistService.revoke(editor.jti(), editor.expiresAt());
        }
    }

    @Transactional(readOnly = true)
    public AdminUserDto getCurrentUser(JwtAuthenticationFilter.AuthenticatedEditor editor) {
        if (editor == null) {
            throw new UnauthorizedException("Sessão não autenticada");
        }
        User user = userRepository.findById(editor.userId())
                .filter(User::isActive)
                .orElseThrow(() -> new UnauthorizedException("Usuário editorial não encontrado"));
        return toUserDto(user);
    }

    private AuthTokenResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthTokenResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.getAccessExpirationSeconds(),
                toUserDto(user)
        );
    }

    private AdminUserDto toUserDto(User user) {
        return new AdminUserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }
}
