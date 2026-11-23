package br.com.crithit.api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Sliding-window rate limiter backed by Redis ZSET with conservative in-memory fallback.
 */
@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);
    private static final String KEY_PREFIX = "crithit:ratelimit:";

    private final StringRedisTemplate redisTemplate;
    private final Map<String, Deque<Long>> localWindows = new ConcurrentHashMap<>();

    public RateLimitService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryConsume(String scope, String subjectKey, int maxRequests, Duration window) {
        String fullKey = KEY_PREFIX + scope + ":" + subjectKey;
        long nowMs = Instant.now().toEpochMilli();
        long windowStartMs = nowMs - window.toMillis();

        try {
            var zSetOps = redisTemplate.opsForZSet();
            zSetOps.removeRangeByScore(fullKey, 0, windowStartMs);
            Long currentCount = zSetOps.zCard(fullKey);
            if (currentCount != null && currentCount >= maxRequests) {
                return false;
            }
            zSetOps.add(fullKey, nowMs + "-" + UUID.randomUUID(), nowMs);
            redisTemplate.expire(fullKey, window.plusSeconds(5));
            return true;
        } catch (Exception ex) {
            log.debug("Redis unavailable for rate limit scope={}; using local fallback: {}", scope, ex.getMessage());
            return tryConsumeLocal(fullKey, maxRequests, nowMs, windowStartMs);
        }
    }

    private boolean tryConsumeLocal(String fullKey, int maxRequests, long nowMs, long windowStartMs) {
        Deque<Long> timestamps = localWindows.computeIfAbsent(fullKey, k -> new ConcurrentLinkedDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() <= windowStartMs) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= maxRequests) {
                return false;
            }
            timestamps.addLast(nowMs);
            return true;
        }
    }
}
