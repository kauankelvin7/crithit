package br.com.crithit.api.domain.entity;

import br.com.crithit.api.domain.enums.Category;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rss_sources")
public class RssSource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "feed_url", nullable = false, unique = true, length = 2048)
    private String feedUrl;

    @Column(name = "site_url", nullable = false, length = 2048)
    private String siteUrl;

    @Column(nullable = false, length = 10)
    private String language = "en";

    @Enumerated(EnumType.STRING)
    @Column(name = "default_category", nullable = false, length = 20)
    private Category defaultCategory;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "consecutive_failures", nullable = false)
    private int consecutiveFailures = 0;

    @Column(name = "circuit_open_until")
    private Instant circuitOpenUntil;

    @Column(name = "last_fetched_at")
    private Instant lastFetchedAt;

    @Column(name = "last_error_message", columnDefinition = "text")
    private String lastErrorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getFeedUrl() { return feedUrl; }
    public void setFeedUrl(String feedUrl) { this.feedUrl = feedUrl; }

    public String getSiteUrl() { return siteUrl; }
    public void setSiteUrl(String siteUrl) { this.siteUrl = siteUrl; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Category getDefaultCategory() { return defaultCategory; }
    public void setDefaultCategory(Category defaultCategory) { this.defaultCategory = defaultCategory; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getConsecutiveFailures() { return consecutiveFailures; }
    public void setConsecutiveFailures(int consecutiveFailures) { this.consecutiveFailures = consecutiveFailures; }

    public Instant getCircuitOpenUntil() { return circuitOpenUntil; }
    public void setCircuitOpenUntil(Instant circuitOpenUntil) { this.circuitOpenUntil = circuitOpenUntil; }

    public Instant getLastFetchedAt() { return lastFetchedAt; }
    public void setLastFetchedAt(Instant lastFetchedAt) { this.lastFetchedAt = lastFetchedAt; }

    public String getLastErrorMessage() { return lastErrorMessage; }
    public void setLastErrorMessage(String lastErrorMessage) { this.lastErrorMessage = lastErrorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
