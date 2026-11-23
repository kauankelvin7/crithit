package br.com.crithit.api.service;

import br.com.crithit.api.web.dto.HomeResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;

/**
 * Redis cache-aside manager with graceful degradation if Redis is unavailable.
 */
@Service
public class ArticleCacheService {

    private static final Logger log = LoggerFactory.getLogger(ArticleCacheService.class);
    private static final String HOME_CACHE_KEY = "crithit:cache:home:v1";
    private static final String ARTICLE_KEY_PREFIX = "crithit:cache:article:";
    private static final String REELS_KEY_PATTERN = "crithit:cache:reels:*";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public ArticleCacheService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<HomeResponse> getCachedHome() {
        try {
            String raw = redisTemplate.opsForValue().get(HOME_CACHE_KEY);
            if (raw != null) {
                return Optional.of(objectMapper.readValue(raw, HomeResponse.class));
            }
        } catch (Exception ex) {
            log.debug("Redis cache read failed for home: {}", ex.getMessage());
        }
        return Optional.empty();
    }

    public void cacheHome(HomeResponse home) {
        try {
            String json = objectMapper.writeValueAsString(home);
            redisTemplate.opsForValue().set(HOME_CACHE_KEY, json, Duration.ofSeconds(60));
        } catch (Exception ex) {
            log.debug("Redis cache write failed for home: {}", ex.getMessage());
        }
    }

    public void evictEditorialCaches(String slug) {
        try {
            redisTemplate.delete(HOME_CACHE_KEY);
            if (slug != null && !slug.isBlank()) {
                redisTemplate.delete(ARTICLE_KEY_PREFIX + slug);
            }
            Set<String> reelKeys = redisTemplate.keys(REELS_KEY_PATTERN);
            if (reelKeys != null && !reelKeys.isEmpty()) {
                redisTemplate.delete(reelKeys);
            }
        } catch (Exception ex) {
            log.debug("Redis cache eviction failed: {}", ex.getMessage());
        }
    }
}
