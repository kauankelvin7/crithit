package br.com.crithit.api.rss;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.security.UrlSecurityValidator;
import com.rometools.rome.feed.synd.SyndEnclosureImpl;
import com.rometools.rome.feed.synd.SyndEntryImpl;
import org.jdom2.Element;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CoverImageExtractorTest {

    private UrlSecurityValidator urlSecurityValidator;
    private AppProperties properties;
    private String stubbedHtml;
    private CoverImageExtractor extractor;

    @BeforeEach
    void setUp() {
        urlSecurityValidator = new UrlSecurityValidator();
        properties = new AppProperties(
                null,
                null,
                null,
                null,
                new AppProperties.RssProperties(true, "0 */15 * * * *", 4, 3000, 5000, 1048576, 0.82, 72, 3, 15, "CritHitBot/1.0"),
                null,
                null
        );
        stubbedHtml = "<html><head><meta property=\"og:image\" content=\"https://cdn.gematsu.com/og-fallback.jpg\"></head></html>";
        extractor = new CoverImageExtractor(urlSecurityValidator, properties) {
            @Override
            protected Document fetchHtmlDocument(URI safeUri) {
                return Jsoup.parse(stubbedHtml, safeUri.toString());
            }
        };
    }

    @Test
    void deveRespeitarPrioridadeDeExtracaoMediaContentMaiorQueEnclosureMaiorQueOgImage() {
        String articleUrl = "https://www.gematsu.com/2026/11/new-rpg";

        // 1. Quando media:content, enclosure e og:image estão presentes -> vence media:content
        SyndEntryImpl entryWithAll = new SyndEntryImpl();
        Element mediaContent = new Element("content");
        mediaContent.setAttribute("url", "https://cdn.gematsu.com/media-priority.jpg");
        mediaContent.setAttribute("type", "image/jpeg");
        entryWithAll.setForeignMarkup(List.of(mediaContent));

        SyndEnclosureImpl enclosure = new SyndEnclosureImpl();
        enclosure.setUrl("https://cdn.gematsu.com/enclosure-second.jpg");
        enclosure.setType("image/jpeg");
        entryWithAll.setEnclosures(List.of(enclosure));

        String firstChoice = extractor.extractValidCoverUrl(entryWithAll, articleUrl, true);
        assertThat(firstChoice).isEqualTo("https://cdn.gematsu.com/media-priority.jpg");

        // 2. Sem media:content, mas com enclosure e og:image -> vence enclosure
        SyndEntryImpl entryWithEnclosure = new SyndEntryImpl();
        entryWithEnclosure.setEnclosures(List.of(enclosure));

        String secondChoice = extractor.extractValidCoverUrl(entryWithEnclosure, articleUrl, true);
        assertThat(secondChoice).isEqualTo("https://cdn.gematsu.com/enclosure-second.jpg");

        // 3. Sem media:content e sem enclosure -> usa og:image da página
        SyndEntryImpl entryOnlyOg = new SyndEntryImpl();
        String thirdChoice = extractor.extractValidCoverUrl(entryOnlyOg, articleUrl, true);
        assertThat(thirdChoice).isEqualTo("https://cdn.gematsu.com/og-fallback.jpg");
    }

    @Test
    void deveRejeitarUrlsInsegurasHostsPrivadosLoopbackEImagensSvgExternas() {
        assertThat(extractor.isSafeImageUrl("javascript:alert(1)")).isFalse();
        assertThat(extractor.isSafeImageUrl("data:image/png;base64,iVBORw0KGgo=")).isFalse();
        assertThat(extractor.isSafeImageUrl("http://127.0.0.1:8080/internal.jpg")).isFalse();
        assertThat(extractor.isSafeImageUrl("http://localhost/admin-cover.png")).isFalse();
        assertThat(extractor.isSafeImageUrl("http://192.168.1.15/router.jpg")).isFalse();
        assertThat(extractor.isSafeImageUrl("http://10.0.0.5/private.webp")).isFalse();
        assertThat(extractor.isSafeImageUrl("http://169.254.169.254/latest/meta-data")).isFalse();
        assertThat(extractor.isSafeImageUrl("https://cdn.example.com/payload.svg")).isFalse();
        assertThat(extractor.isSafeImageUrl("https://cdn.example.com/vector.SVG?width=1200")).isFalse();
        assertThat(extractor.isSafeImageUrl("https://cdn.example.com/cover-hd.webp")).isTrue();
    }

    @Test
    void deveAplicarFallbackDeterministicoParaCoverArtKeyPorEditoriaQuandoNaoHouverImagemValida() {
        SyndEntryImpl emptyEntry = new SyndEntryImpl();

        CoverImageExtractor.CoverResolution games = extractor.resolveCover(emptyEntry, null, Category.GAMES, false);
        CoverImageExtractor.CoverResolution comics = extractor.resolveCover(emptyEntry, null, Category.COMICS, false);
        CoverImageExtractor.CoverResolution cinema = extractor.resolveCover(emptyEntry, null, Category.CINEMA, false);
        CoverImageExtractor.CoverResolution animes = extractor.resolveCover(emptyEntry, null, Category.ANIMES, false);
        CoverImageExtractor.CoverResolution tech = extractor.resolveCover(emptyEntry, null, Category.TECH, false);

        assertThat(games.coverImageUrl()).isNull();
        assertThat(games.coverArtKey()).isEqualTo("editorial-games-default");
        assertThat(comics.coverArtKey()).isEqualTo("editorial-comics-default");
        assertThat(cinema.coverArtKey()).isEqualTo("editorial-cinema-default");
        assertThat(animes.coverArtKey()).isEqualTo("editorial-animes-default");
        assertThat(tech.coverArtKey()).isEqualTo("editorial-tech-default");
    }
}
