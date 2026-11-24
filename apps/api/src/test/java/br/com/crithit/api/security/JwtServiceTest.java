package br.com.crithit.api.security;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.entity.User;
import br.com.crithit.api.domain.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private static final String TEST_SECRET = "crithit-unit-test-secret-key-with-at-least-32-bytes-length!!";

    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    private JwtService jwtService;
    private JwtBlacklistService blacklistService;

    @BeforeEach
    void setUp() {
        jwtService = buildJwtService(TEST_SECRET, 900L, 604800L);
        blacklistService = new JwtBlacklistService(redisTemplate);
    }

    @Test
    void deveGerarTokenValidoExtrairSubjectERoleAdminOuEditor() {
        User admin = buildUser(UserRole.ROLE_ADMIN, "admin@crithit.com.br", "Admin CritHit");
        User editor = buildUser(UserRole.ROLE_EDITOR, "editor@crithit.com.br", "Editor CritHit");

        String adminToken = jwtService.generateAccessToken(admin);
        String editorToken = jwtService.generateAccessToken(editor);

        Claims adminClaims = jwtService.parseAndValidate(adminToken, JwtService.TOKEN_TYPE_ACCESS);
        Claims editorClaims = jwtService.parseAndValidate(editorToken, JwtService.TOKEN_TYPE_ACCESS);

        assertThat(adminClaims.getSubject()).isEqualTo(admin.getId().toString());
        assertThat(adminClaims.get("role", String.class)).isEqualTo("ROLE_ADMIN");
        assertThat(adminClaims.get("email", String.class)).isEqualTo("admin@crithit.com.br");

        assertThat(editorClaims.getSubject()).isEqualTo(editor.getId().toString());
        assertThat(editorClaims.get("role", String.class)).isEqualTo("ROLE_EDITOR");
    }

    @Test
    void deveRejeitarTokenExpiradoOuAdulterado() {
        User admin = buildUser(UserRole.ROLE_ADMIN, "admin@crithit.com.br", "Admin CritHit");

        // Token adulterado (assinatura inválida)
        String validToken = jwtService.generateAccessToken(admin);
        String tamperedToken = validToken.substring(0, validToken.length() - 4) + "ABCD";

        assertThatThrownBy(() -> jwtService.parseAndValidate(tamperedToken, JwtService.TOKEN_TYPE_ACCESS))
                .isInstanceOf(JwtException.class);

        // Token com tipo refresh apresentado como access
        String refreshToken = jwtService.generateRefreshToken(admin);
        assertThatThrownBy(() -> jwtService.parseAndValidate(refreshToken, JwtService.TOKEN_TYPE_ACCESS))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("Unexpected token type");

        // Token expirado além do clockSkew (30s)
        Instant past = Instant.now().minusSeconds(120);
        String expiredToken = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer("crithit-api")
                .subject(admin.getId().toString())
                .claim("typ", JwtService.TOKEN_TYPE_ACCESS)
                .claim("role", admin.getRole().name())
                .issuedAt(Date.from(past.minusSeconds(60)))
                .expiration(Date.from(past))
                .signWith(Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();

        assertThatThrownBy(() -> jwtService.parseAndValidate(expiredToken, JwtService.TOKEN_TYPE_ACCESS))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void deveRespeitarRevogacaoViaJwtBlacklistService() {
        User admin = buildUser(UserRole.ROLE_ADMIN, "admin@crithit.com.br", "Admin CritHit");
        String accessToken = jwtService.generateAccessToken(admin);
        Claims claims = jwtService.parseAndValidate(accessToken, JwtService.TOKEN_TYPE_ACCESS);
        String jti = claims.getId();
        Instant expiresAt = claims.getExpiration().toInstant();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(redisTemplate.hasKey("crithit:jwt:blacklist:" + jti)).thenReturn(true);

        blacklistService.revoke(jti, expiresAt);

        verify(valueOperations).set(eq("crithit:jwt:blacklist:" + jti), eq("revoked"), any(Duration.class));
        assertThat(blacklistService.isRevoked(jti)).isTrue();
        assertThat(blacklistService.isRevoked(null)).isTrue();
    }

    private JwtService buildJwtService(String secret, long accessTtl, long refreshTtl) {
        AppProperties props = new AppProperties(
                null,
                new AppProperties.SecurityProperties(
                        new AppProperties.SecurityProperties.JwtProperties(secret, "crithit-api", accessTtl, refreshTtl),
                        "salt-test",
                        false
                ),
                null,
                null,
                null,
                null,
                null
        );
        return new JwtService(props);
    }

    private User buildUser(UserRole role, String email, String displayName) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        user.setEmail(email);
        user.setDisplayName(displayName);
        return user;
    }
}
