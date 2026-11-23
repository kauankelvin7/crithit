package br.com.crithit.api.domain.entity;

import br.com.crithit.api.domain.enums.NewsletterStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "newsletter_subscribers")
public class NewsletterSubscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NewsletterStatus status = NewsletterStatus.ACTIVE;

    @Column(name = "source_origin", nullable = false, length = 60)
    private String sourceOrigin = "HOME_LOOT_DIARIO";

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "ip_hash", length = 64, columnDefinition = "char(64)")
    private String ipHash;

    @Column(name = "subscribed_at", nullable = false, updatable = false)
    private Instant subscribedAt;

    @Column(name = "unsubscribed_at")
    private Instant unsubscribedAt;

    @PrePersist
    void prePersist() {
        if (subscribedAt == null) subscribedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public NewsletterStatus getStatus() { return status; }
    public void setStatus(NewsletterStatus status) { this.status = status; }

    public String getSourceOrigin() { return sourceOrigin; }
    public void setSourceOrigin(String sourceOrigin) { this.sourceOrigin = sourceOrigin; }

    public String getIpHash() { return ipHash; }
    public void setIpHash(String ipHash) { this.ipHash = ipHash; }

    public Instant getSubscribedAt() { return subscribedAt; }
    public void setSubscribedAt(Instant subscribedAt) { this.subscribedAt = subscribedAt; }

    public Instant getUnsubscribedAt() { return unsubscribedAt; }
    public void setUnsubscribedAt(Instant unsubscribedAt) { this.unsubscribedAt = unsubscribedAt; }
}
