-- ============================================================================
-- CritHit! — Schema Relacional e Vetorial (PostgreSQL 16 + pgvector)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- 1. Usuários Editoriais (/admin)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(160) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(120) NOT NULL,
    role            VARCHAR(30)  NOT NULL DEFAULT 'ROLE_EDITOR',
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('ROLE_ADMIN', 'ROLE_EDITOR')),
    CONSTRAINT chk_users_display_name_len CHECK (char_length(btrim(display_name)) >= 2)
);

-- ----------------------------------------------------------------------------
-- 2. Fontes RSS Monitoradas
-- ----------------------------------------------------------------------------
CREATE TABLE rss_sources (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(120) NOT NULL,
    feed_url             VARCHAR(2048) NOT NULL,
    site_url             VARCHAR(2048) NOT NULL,
    language             VARCHAR(10)  NOT NULL DEFAULT 'en',
    default_category     VARCHAR(20)  NOT NULL,
    active               BOOLEAN      NOT NULL DEFAULT TRUE,
    consecutive_failures INTEGER      NOT NULL DEFAULT 0,
    circuit_open_until   TIMESTAMPTZ,
    last_fetched_at      TIMESTAMPTZ,
    last_error_message   TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_rss_sources_feed_url UNIQUE (feed_url),
    CONSTRAINT chk_rss_sources_feed_url_proto CHECK (feed_url ~* '^https?://[^[:space:]]+'),
    CONSTRAINT chk_rss_sources_site_url_proto CHECK (site_url ~* '^https?://[^[:space:]]+'),
    CONSTRAINT chk_rss_sources_lang CHECK (language IN ('pt-BR', 'en', 'es', 'ja')),
    CONSTRAINT chk_rss_sources_category CHECK (default_category IN ('GAMES', 'COMICS', 'CINEMA', 'ANIMES', 'TECH')),
    CONSTRAINT chk_rss_sources_failures_nonneg CHECK (consecutive_failures >= 0)
);

CREATE INDEX idx_rss_sources_active ON rss_sources (active) WHERE active = TRUE;

-- ----------------------------------------------------------------------------
-- 3. Artigos / Matérias (Núcleo Editorial + Vetor pgvector)
-- ----------------------------------------------------------------------------
CREATE TABLE articles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                  VARCHAR(180) NOT NULL,
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING_REVIEW',
    ai_status             VARCHAR(20)  NOT NULL DEFAULT 'SUCCESS',
    category              VARCHAR(20)  NOT NULL,
    editorial_format      VARCHAR(20)  NOT NULL DEFAULT 'NEWS',

    -- Regras Inegociáveis de Atribuição Jornalística
    content_type          VARCHAR(20)  NOT NULL,
    author_name           VARCHAR(120) NOT NULL,
    source_name           VARCHAR(120) NOT NULL,
    source_url            VARCHAR(2048) NOT NULL,
    canonical_url_hash    CHAR(64),

    -- Conteúdo Editorial Estruturado
    headline              VARCHAR(180) NOT NULL,
    subheadline_bullets   JSONB        NOT NULL DEFAULT '[]'::jsonb,
    lead                  TEXT         NOT NULL,
    body_paragraphs       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    reels_summary         VARCHAR(320) NOT NULL,
    tags                  JSONB        NOT NULL DEFAULT '[]'::jsonb,

    -- Mídia e Fallback Visual
    cover_image_url       VARCHAR(2048),
    cover_art_key         VARCHAR(60)  NOT NULL DEFAULT 'editorial-games-default',

    -- Metadados e Destaque
    reading_time_minutes  INTEGER      NOT NULL DEFAULT 2,
    review_score          NUMERIC(3,1),
    is_main_headline      BOOLEAN      NOT NULL DEFAULT FALSE,
    is_urgent             BOOLEAN      NOT NULL DEFAULT FALSE,

    -- Dados Brutos de Origem (Split-Screen / Fallback LLM)
    raw_title             VARCHAR(300),
    raw_excerpt           TEXT,
    editorial_notes       JSONB        NOT NULL DEFAULT '[]'::jsonb,

    -- Vetor Semântico para Deduplicação (cosine_similarity >= 0.82)
    embedding             vector(1536),

    -- Contadores Preservados Mesmo em UNPUBLISHED
    views_count           BIGINT       NOT NULL DEFAULT 0,
    likes_count           BIGINT       NOT NULL DEFAULT 0,
    saves_count           BIGINT       NOT NULL DEFAULT 0,
    comments_count        BIGINT       NOT NULL DEFAULT 0,

    -- Rastreabilidade Editorial
    primary_rss_source_id UUID         REFERENCES rss_sources(id) ON DELETE SET NULL,
    reviewed_by           UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_by            UUID         REFERENCES users(id) ON DELETE SET NULL,
    scheduled_at          TIMESTAMPTZ,
    published_at          TIMESTAMPTZ,
    unpublished_at        TIMESTAMPTZ,
    discarded_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_articles_slug UNIQUE (slug),
    CONSTRAINT uq_articles_canonical_url_hash UNIQUE (canonical_url_hash),
    CONSTRAINT chk_articles_status CHECK (
        status IN ('PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'DISCARDED')
    ),
    CONSTRAINT chk_articles_ai_status CHECK (
        ai_status IN ('SUCCESS', 'FALLBACK_RAW', 'MANUAL')
    ),
    CONSTRAINT chk_articles_category CHECK (
        category IN ('GAMES', 'COMICS', 'CINEMA', 'ANIMES', 'TECH')
    ),
    CONSTRAINT chk_articles_format CHECK (
        editorial_format IN ('NEWS', 'COLUMN', 'REVIEW')
    ),
    CONSTRAINT chk_articles_content_type CHECK (
        content_type IN ('AUTORAL', 'CURADORIA')
    ),
    CONSTRAINT chk_articles_author_name_len CHECK (char_length(btrim(author_name)) >= 2),
    CONSTRAINT chk_articles_source_name_len CHECK (char_length(btrim(source_name)) >= 2),
    CONSTRAINT chk_articles_source_url_proto CHECK (source_url ~* '^https?://[^[:space:]]+'),
    CONSTRAINT chk_articles_cover_url_proto CHECK (
        cover_image_url IS NULL OR cover_image_url ~* '^https?://[^[:space:]]+'
    ),
    CONSTRAINT chk_articles_reading_time_pos CHECK (reading_time_minutes >= 1 AND reading_time_minutes <= 60),
    CONSTRAINT chk_articles_review_score_range CHECK (
        review_score IS NULL OR (review_score >= 0.0 AND review_score <= 10.0)
    ),
    CONSTRAINT chk_articles_main_headline_only_published CHECK (
        is_main_headline = FALSE OR status = 'PUBLISHED'
    ),
    CONSTRAINT chk_articles_counts_nonneg CHECK (
        views_count >= 0 AND likes_count >= 0 AND saves_count >= 0 AND comments_count >= 0
    )
);

-- Unicidade transacional garantida no banco: no máximo 1 Manchete Principal PUBLISHED
CREATE UNIQUE INDEX uq_articles_single_main_headline
    ON articles (is_main_headline)
    WHERE status = 'PUBLISHED' AND is_main_headline = TRUE;

-- Índices para consultas da capa, Reels, scheduler e busca editorial
CREATE INDEX idx_articles_published_feed
    ON articles (published_at DESC, created_at DESC)
    WHERE status = 'PUBLISHED';

CREATE INDEX idx_articles_published_category
    ON articles (category, published_at DESC)
    WHERE status = 'PUBLISHED';

CREATE INDEX idx_articles_most_read_7d
    ON articles (views_count DESC, published_at DESC)
    WHERE status = 'PUBLISHED';

CREATE INDEX idx_articles_pending_review
    ON articles (created_at DESC)
    WHERE status = 'PENDING_REVIEW';

CREATE INDEX idx_articles_scheduled_due
    ON articles (scheduled_at ASC)
    WHERE status = 'SCHEDULED';

CREATE INDEX idx_articles_dedup_window
    ON articles (created_at DESC, status)
    WHERE embedding IS NOT NULL AND status IN ('PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'DISCARDED');

-- Índice trigram para busca textual rápida (GET /api/v1/articles?q=...)
CREATE INDEX idx_articles_headline_trgm
    ON articles USING GIN (headline gin_trgm_ops);

-- Índice HNSW pgvector para busca aproximada por distância cosseno (<=>)
CREATE INDEX idx_articles_embedding_hnsw
    ON articles USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ----------------------------------------------------------------------------
-- 4. Fontes Cruzadas / Agrupamento Semântico (matched_sources)
-- ----------------------------------------------------------------------------
CREATE TABLE article_sources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id          UUID         NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    rss_source_id       UUID         REFERENCES rss_sources(id) ON DELETE SET NULL,
    source_name         VARCHAR(120) NOT NULL,
    source_url          VARCHAR(2048) NOT NULL,
    canonical_url_hash  CHAR(64)     NOT NULL,
    original_title      VARCHAR(300) NOT NULL,
    original_excerpt    TEXT,
    similarity_score    NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
    is_primary          BOOLEAN      NOT NULL DEFAULT FALSE,
    fetched_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_article_sources_url_hash UNIQUE (canonical_url_hash),
    CONSTRAINT chk_article_sources_url_proto CHECK (source_url ~* '^https?://[^[:space:]]+'),
    CONSTRAINT chk_article_sources_similarity_range CHECK (
        similarity_score >= 0.0000 AND similarity_score <= 1.0000
    )
);

CREATE INDEX idx_article_sources_article_id ON article_sources (article_id, fetched_at DESC);

-- ----------------------------------------------------------------------------
-- 5. Comentários de Leitores
-- ----------------------------------------------------------------------------
CREATE TABLE article_comments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id          UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    visitor_hash        CHAR(64)    NOT NULL,
    author_display_name VARCHAR(60) NOT NULL,
    body                TEXT        NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_article_comments_author_len CHECK (char_length(btrim(author_display_name)) >= 2),
    CONSTRAINT chk_article_comments_body_len CHECK (
        char_length(btrim(body)) >= 3 AND char_length(body) <= 1000
    ),
    CONSTRAINT chk_article_comments_status CHECK (status IN ('VISIBLE', 'HIDDEN'))
);

CREATE INDEX idx_article_comments_article_visible
    ON article_comments (article_id, created_at DESC)
    WHERE status = 'VISIBLE';

-- ----------------------------------------------------------------------------
-- 6. Interações Anônimas (Views / Likes / Saves)
-- ----------------------------------------------------------------------------
CREATE TABLE article_interactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id        UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    visitor_hash      CHAR(64)    NOT NULL,
    interaction_type  VARCHAR(10) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_article_interactions_type CHECK (interaction_type IN ('VIEW', 'LIKE', 'SAVE'))
);

CREATE UNIQUE INDEX uq_article_interactions_toggle
    ON article_interactions (article_id, visitor_hash, interaction_type)
    WHERE interaction_type IN ('LIKE', 'SAVE');

CREATE INDEX idx_article_interactions_views_lookup
    ON article_interactions (article_id, visitor_hash, created_at DESC)
    WHERE interaction_type = 'VIEW';

-- ----------------------------------------------------------------------------
-- 7. Assinantes da Newsletter ("Loot Diário")
-- ----------------------------------------------------------------------------
CREATE TABLE newsletter_subscribers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            VARCHAR(180) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    source_origin    VARCHAR(60)  NOT NULL DEFAULT 'HOME_LOOT_DIARIO',
    ip_hash          CHAR(64),
    subscribed_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    unsubscribed_at  TIMESTAMPTZ,

    CONSTRAINT uq_newsletter_email UNIQUE (email),
    CONSTRAINT chk_newsletter_status CHECK (status IN ('ACTIVE', 'UNSUBSCRIBED'))
);

-- ----------------------------------------------------------------------------
-- 8. Auditoria Editorial
-- ----------------------------------------------------------------------------
CREATE TABLE editorial_audit_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id     UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    actor_user_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
    action         VARCHAR(40) NOT NULL,
    from_status    VARCHAR(20),
    to_status      VARCHAR(20),
    metadata       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_audit_action CHECK (
        action IN (
            'INGESTED_RSS',
            'INGESTED_FALLBACK_RAW',
            'MATCHED_SOURCE_ADDED',
            'CREATED_MANUAL',
            'EDITED',
            'APPROVED_PUBLISHED',
            'SCHEDULED',
            'AUTO_PUBLISHED_BY_SCHEDULER',
            'DISCARDED',
            'UNPUBLISHED',
            'REPUBLISHED',
            'SET_MAIN_HEADLINE',
            'UNSET_MAIN_HEADLINE'
        )
    )
);

CREATE INDEX idx_editorial_audit_article ON editorial_audit_logs (article_id, created_at DESC);
