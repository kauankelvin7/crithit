-- ============================================================================
-- Seed Inicial de Feeds RSS Reais (Internacionais e Nacionais)
-- ============================================================================

INSERT INTO rss_sources (name, feed_url, site_url, language, default_category, active)
VALUES
    -- Internacionais (Games, Animes, Cinema/Séries, Comics, Tech)
    ('IGN', 'https://feeds.feedburner.com/ign/all', 'https://www.ign.com', 'en', 'GAMES', TRUE),
    ('Gematsu', 'https://www.gematsu.com/feed', 'https://www.gematsu.com', 'en', 'GAMES', TRUE),
    ('Eurogamer', 'https://www.eurogamer.net/feed', 'https://www.eurogamer.net', 'en', 'GAMES', TRUE),
    ('Anime News Network', 'https://www.animenewsnetwork.com/all/rss.xml', 'https://www.animenewsnetwork.com', 'en', 'ANIMES', TRUE),
    ('Variety', 'https://variety.com/feed/', 'https://variety.com', 'en', 'CINEMA', TRUE),
    ('Bleeding Cool', 'https://bleedingcool.com/feed/', 'https://bleedingcool.com', 'en', 'COMICS', TRUE),

    -- Nacionais (PT-BR)
    ('Omelete', 'https://www.omelete.com.br/rss', 'https://www.omelete.com.br', 'pt-BR', 'CINEMA', TRUE),
    ('Jovem Nerd', 'https://jovemnerd.com.br/feed/', 'https://jovemnerd.com.br', 'pt-BR', 'GAMES', TRUE),
    ('Voxel / TecMundo', 'https://rss.tecmundo.com.br/feed', 'https://www.tecmundo.com.br/voxel', 'pt-BR', 'TECH', TRUE)
ON CONFLICT (feed_url) DO NOTHING;
