package br.com.crithit.api.domain.entity;

import br.com.crithit.api.domain.enums.AiStatus;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.ContentType;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.domain.type.PgVectorUserType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "articles")
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ArticleStatus status = ArticleStatus.PENDING_REVIEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_status", nullable = false, length = 20)
    private AiStatus aiStatus = AiStatus.SUCCESS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "editorial_format", nullable = false, length = 20)
    private EditorialFormat editorialFormat = EditorialFormat.NEWS;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    @Column(name = "author_name", nullable = false, length = 120)
    private String authorName;

    @Column(name = "source_name", nullable = false, length = 120)
    private String sourceName;

    @Column(name = "source_url", nullable = false, length = 2048)
    private String sourceUrl;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "canonical_url_hash", unique = true, length = 64, columnDefinition = "char(64)")
    private String canonicalUrlHash;

    @Column(nullable = false, length = 180)
    private String headline;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "subheadline_bullets", nullable = false, columnDefinition = "jsonb")
    private List<String> subheadlineBullets = new ArrayList<>();

    @Column(nullable = false, columnDefinition = "text")
    private String lead;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "body_paragraphs", nullable = false, columnDefinition = "jsonb")
    private List<String> bodyParagraphs = new ArrayList<>();

    @Column(name = "reels_summary", nullable = false, length = 320)
    private String reelsSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<String> tags = new ArrayList<>();

    @Column(name = "cover_image_url", length = 2048)
    private String coverImageUrl;

    @Column(name = "cover_art_key", nullable = false, length = 60)
    private String coverArtKey = "editorial-games-default";

    @Column(name = "reading_time_minutes", nullable = false)
    private int readingTimeMinutes = 2;

    @Column(name = "review_score", precision = 3, scale = 1)
    private BigDecimal reviewScore;

    @Column(name = "is_main_headline", nullable = false)
    private boolean isMainHeadline = false;

    @Column(name = "is_urgent", nullable = false)
    private boolean isUrgent = false;

    @Column(name = "raw_title", length = 300)
    private String rawTitle;

    @Column(name = "raw_excerpt", columnDefinition = "text")
    private String rawExcerpt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "editorial_notes", nullable = false, columnDefinition = "jsonb")
    private List<String> editorialNotes = new ArrayList<>();

    @Type(PgVectorUserType.class)
    @Column(name = "embedding", columnDefinition = "vector(1536)")
    private float[] embedding;

    @Column(name = "views_count", nullable = false)
    private long viewsCount = 0L;

    @Column(name = "likes_count", nullable = false)
    private long likesCount = 0L;

    @Column(name = "saves_count", nullable = false)
    private long savesCount = 0L;

    @Column(name = "comments_count", nullable = false)
    private long commentsCount = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_rss_source_id")
    private RssSource primaryRssSource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "unpublished_at")
    private Instant unpublishedAt;

    @Column(name = "discarded_at")
    private Instant discardedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (subheadlineBullets == null) subheadlineBullets = new ArrayList<>();
        if (bodyParagraphs == null) bodyParagraphs = new ArrayList<>();
        if (tags == null) tags = new ArrayList<>();
        if (editorialNotes == null) editorialNotes = new ArrayList<>();
        if (coverArtKey == null && category != null) {
            coverArtKey = category.defaultCoverArtKey();
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public ArticleStatus getStatus() { return status; }
    public void setStatus(ArticleStatus status) { this.status = status; }

    public AiStatus getAiStatus() { return aiStatus; }
    public void setAiStatus(AiStatus aiStatus) { this.aiStatus = aiStatus; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public EditorialFormat getEditorialFormat() { return editorialFormat; }
    public void setEditorialFormat(EditorialFormat editorialFormat) { this.editorialFormat = editorialFormat; }

    public ContentType getContentType() { return contentType; }
    public void setContentType(ContentType contentType) { this.contentType = contentType; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getCanonicalUrlHash() { return canonicalUrlHash; }
    public void setCanonicalUrlHash(String canonicalUrlHash) { this.canonicalUrlHash = canonicalUrlHash; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public List<String> getSubheadlineBullets() { return subheadlineBullets; }
    public void setSubheadlineBullets(List<String> subheadlineBullets) {
        this.subheadlineBullets = subheadlineBullets != null ? subheadlineBullets : new ArrayList<>();
    }

    public String getLead() { return lead; }
    public void setLead(String lead) { this.lead = lead; }

    public List<String> getBodyParagraphs() { return bodyParagraphs; }
    public void setBodyParagraphs(List<String> bodyParagraphs) {
        this.bodyParagraphs = bodyParagraphs != null ? bodyParagraphs : new ArrayList<>();
    }

    public String getReelsSummary() { return reelsSummary; }
    public void setReelsSummary(String reelsSummary) { this.reelsSummary = reelsSummary; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) {
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }

    public String getCoverArtKey() { return coverArtKey; }
    public void setCoverArtKey(String coverArtKey) { this.coverArtKey = coverArtKey; }

    public int getReadingTimeMinutes() { return readingTimeMinutes; }
    public void setReadingTimeMinutes(int readingTimeMinutes) { this.readingTimeMinutes = readingTimeMinutes; }

    public BigDecimal getReviewScore() { return reviewScore; }
    public void setReviewScore(BigDecimal reviewScore) { this.reviewScore = reviewScore; }

    public boolean isMainHeadline() { return isMainHeadline; }
    public void setMainHeadline(boolean mainHeadline) { isMainHeadline = mainHeadline; }

    public boolean isUrgent() { return isUrgent; }
    public void setUrgent(boolean urgent) { isUrgent = urgent; }

    public String getRawTitle() { return rawTitle; }
    public void setRawTitle(String rawTitle) { this.rawTitle = rawTitle; }

    public String getRawExcerpt() { return rawExcerpt; }
    public void setRawExcerpt(String rawExcerpt) { this.rawExcerpt = rawExcerpt; }

    public List<String> getEditorialNotes() { return editorialNotes; }
    public void setEditorialNotes(List<String> editorialNotes) {
        this.editorialNotes = editorialNotes != null ? editorialNotes : new ArrayList<>();
    }

    public float[] getEmbedding() { return embedding; }
    public void setEmbedding(float[] embedding) { this.embedding = embedding; }

    public long getViewsCount() { return viewsCount; }
    public void setViewsCount(long viewsCount) { this.viewsCount = viewsCount; }

    public long getLikesCount() { return likesCount; }
    public void setLikesCount(long likesCount) { this.likesCount = likesCount; }

    public long getSavesCount() { return savesCount; }
    public void setSavesCount(long savesCount) { this.savesCount = savesCount; }

    public long getCommentsCount() { return commentsCount; }
    public void setCommentsCount(long commentsCount) { this.commentsCount = commentsCount; }

    public RssSource getPrimaryRssSource() { return primaryRssSource; }
    public void setPrimaryRssSource(RssSource primaryRssSource) { this.primaryRssSource = primaryRssSource; }

    public User getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(User reviewedBy) { this.reviewedBy = reviewedBy; }

    public User getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(User updatedBy) { this.updatedBy = updatedBy; }

    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }

    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }

    public Instant getUnpublishedAt() { return unpublishedAt; }
    public void setUnpublishedAt(Instant unpublishedAt) { this.unpublishedAt = unpublishedAt; }

    public Instant getDiscardedAt() { return discardedAt; }
    public void setDiscardedAt(Instant discardedAt) { this.discardedAt = discardedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
