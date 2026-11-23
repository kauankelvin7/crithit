package br.com.crithit.api.service;

import br.com.crithit.api.web.dto.HealthResponse;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class HealthService {

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;

    public HealthService(JdbcTemplate jdbcTemplate, StringRedisTemplate redisTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
    }

    public HealthResponse checkHealth() {
        String dbStatus = checkDatabase();
        String redisStatus = checkRedis();
        boolean allUp = "UP".equals(dbStatus) && "UP".equals(redisStatus);
        return new HealthResponse(
                allUp ? "UP" : "DEGRADED",
                dbStatus,
                redisStatus,
                Instant.now()
        );
    }

    private String checkDatabase() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return result != null && result == 1 ? "UP" : "DOWN";
        } catch (Exception ex) {
            return "DOWN";
        }
    }

    private String checkRedis() {
        try {
            String pong = redisTemplate.execute((RedisConnection conn) -> conn.ping());
            return pong != null && pong.equalsIgnoreCase("PONG") ? "UP" : "DOWN";
        } catch (Exception ex) {
            return "DOWN";
        }
    }
}
