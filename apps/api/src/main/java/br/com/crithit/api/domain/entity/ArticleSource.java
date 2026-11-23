package br.com.crithit.api.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "article_sources")
public class ArticleSource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "article_id", nullable = false)
    private Article article;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rss_source_id")
    private RssSource rssSource;

    @Column(name = "source_name", nullable = false, length = 120)
    private String sourceName;

    @Column(name = "source_url", nullable = false, length = 2048)
    private String sourceUrl;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "canonical_url_hash", nullable = false, unique = true, length = 64, columnDefinition = "char(64)")
    private String canonicalUrlHash;

    @Column(name = "original_title", nullable = false, length = 300)
    private String originalTitle;

    @Column(name = "original_excerpt", columnDefinition = "text")
    private String originalExcerpt;

    @Column(name = "similarity_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal similarityScore = BigDecimal.ONE;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary = false;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (fetchedAt == null) fetchedAt = now;
        if (createdAt == null) createdAt = now;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Article getArticle() { return article; }
    public void setArticle(Article article) { this.article = article; }

    public RssSource getRssSource() { return rssSource; }
    public void setRssSource(RssSource rssSource) { this.rssSource = rssSource; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getCanonicalUrlHash() { return canonicalUrlHash; }
    public void setCanonicalUrlHash(String canonicalUrlHash) { this.canonicalUrlHash = canonicalUrlHash; }

    public String getOriginalTitle() { return originalTitle; }
    public void setOriginalTitle(String originalTitle) { this.originalTitle = originalTitle; }

    public String getOriginalExcerpt() { return originalExcerpt; }
    public void setOriginalExcerpt(String originalExcerpt) { this.originalExcerpt = originalExcerpt; }

    public BigDecimal getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(BigDecimal similarityScore) { this.similarityScore = similarityScore; }

    public boolean isPrimary() { return isPrimary; }
    public void setPrimary(boolean primary) { isPrimary = primary; }

    public Instant getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(Instant fetchedAt) { this.fetchedAt = fetchedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
