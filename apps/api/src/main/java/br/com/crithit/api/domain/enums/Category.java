package br.com.crithit.api.domain.enums;

public enum Category {
    GAMES("editorial-games-default"),
    COMICS("editorial-comics-default"),
    CINEMA("editorial-cinema-default"),
    ANIMES("editorial-animes-default"),
    TECH("editorial-tech-default");

    private final String defaultCoverArtKey;

    Category(String defaultCoverArtKey) {
        this.defaultCoverArtKey = defaultCoverArtKey;
    }

    public String defaultCoverArtKey() {
        return defaultCoverArtKey;
    }
}
