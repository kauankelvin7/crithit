package br.com.crithit.api.security;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String CLAIM_TYPE = "typ";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_NAME = "name";
    public static final String TOKEN_TYPE_ACCESS = "access";
    public static final String TOKEN_TYPE_REFRESH = "refresh";

    private final SecretKey signingKey;
    private final String issuer;
    private final long accessExpirationSeconds;
    private final long refreshExpirationSeconds;

    public JwtService(AppProperties properties) {
        AppProperties.SecurityProperties.JwtProperties jwtProps = properties.security().jwt();
        this.issuer = StringUtils.hasText(jwtProps.issuer()) ? jwtProps.issuer() : "crithit-api";
        this.accessExpirationSeconds = jwtProps.accessExpirationSeconds() > 0
                ? jwtProps.accessExpirationSeconds() : 900L;
        this.refreshExpirationSeconds = jwtProps.refreshExpirationSeconds() > 0
                ? jwtProps.refreshExpirationSeconds() : 604800L;

        String secret = jwtProps.secret();
        if (!StringUtils.hasText(secret)) {
            log.warn("JWT_SECRET is not configured; generating ephemeral in-memory signing key for this instance.");
            byte[] randomBytes = new byte[48];
            new SecureRandom().nextBytes(randomBytes);
            this.signingKey = Keys.hmacShaKeyFor(randomBytes);
        } else {
            byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) {
                throw new IllegalStateException("JWT_SECRET must be at least 32 bytes long for HMAC-SHA256");
            }
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
    }

    public String generateAccessToken(User user) {
        return buildToken(user, TOKEN_TYPE_ACCESS, accessExpirationSeconds);
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, TOKEN_TYPE_REFRESH, refreshExpirationSeconds);
    }

    private String buildToken(User user, String tokenType, long ttlSeconds) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(ttlSeconds);
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .subject(user.getId().toString())
                .claim(CLAIM_TYPE, tokenType)
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_EMAIL, user.getEmail())
                .claim(CLAIM_NAME, user.getDisplayName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseAndValidate(String token, String expectedType) throws JwtException {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(issuer)
                .clockSkewSeconds(30)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String actualType = claims.get(CLAIM_TYPE, String.class);
        if (!expectedType.equals(actualType)) {
            throw new JwtException("Unexpected token type: " + actualType);
        }
        return claims;
    }

    public long getAccessExpirationSeconds() {
        return accessExpirationSeconds;
    }
}
