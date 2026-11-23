package br.com.crithit.api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks revoked JWT token IDs (jti) in Redis until their natural expiration.
 */
@Service
public class JwtBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(JwtBlacklistService.class);
    private static final String KEY_PREFIX = "crithit:jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;
    private final Map<String, Instant> localFallback = new ConcurrentHashMap<>();

    public JwtBlacklistService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void revoke(String jti, Instant expiresAt) {
        if (jti == null || expiresAt == null) {
            return;
        }
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isNegative() || ttl.isZero()) {
            return;
        }
        try {
            redisTemplate.opsForValue().set(KEY_PREFIX + jti, "revoked", ttl);
        } catch (Exception ex) {
            log.warn("Redis unavailable while revoking JWT jti={}; storing in local fallback: {}", jti, ex.getMessage());
            localFallback.put(jti, expiresAt);
        }
    }

    public boolean isRevoked(String jti) {
        if (jti == null) {
            return true;
        }
        Instant fallbackExpiry = localFallback.get(jti);
        if (fallbackExpiry != null) {
            if (fallbackExpiry.isAfter(Instant.now())) {
                return true;
            }
            localFallback.remove(jti);
        }
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(KEY_PREFIX + jti));
        } catch (Exception ex) {
            log.warn("Redis unavailable while checking JWT blacklist for jti={}: {}", jti, ex.getMessage());
            return false;
        }
    }
}
