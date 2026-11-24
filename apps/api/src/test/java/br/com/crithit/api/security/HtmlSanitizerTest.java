package br.com.crithit.api.security;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlSanitizerTest {

    private final HtmlSanitizer sanitizer = new HtmlSanitizer();

    @Test
    void deveRemoverScriptIframeSvgOnloadAtributosOnerrorOnclickELinksJavascript() {
        String maliciousComment = "<script>alert('xss')</script>"
                + "<iframe src=\"https://evil.example.com\"></iframe>"
                + "<svg onload=\"fetch('https://evil.example.com')\"></svg>"
                + "<img src=\"x\" onerror=\"alert(1)\" onclick=\"stealCookies()\">"
                + "<a href=\"javascript:alert(document.cookie)\">Clique aqui</a>"
                + " Análise legítima do trailer.";

        String cleaned = sanitizer.stripAllHtml(maliciousComment);

        assertThat(cleaned)
                .doesNotContain("<script")
                .doesNotContain("<iframe")
                .doesNotContain("<svg")
                .doesNotContain("onload")
                .doesNotContain("onerror")
                .doesNotContain("onclick")
                .doesNotContain("javascript:")
                .isEqualTo("Clique aqui Análise legítima do trailer.");
    }

    @Test
    void devePreservarAcentuacaoEmPortuguesPontuacaoAspasETextoLegitimo() {
        String ptBrEditorialText = "A edição de colecionador de \"Baldur's Gate 3\" traz tradução, "
                + "diálogos inéditos & trilha sonora orquestrada — lançamento em São Paulo às 19h!";

        String cleaned = sanitizer.stripAllHtml(ptBrEditorialText);

        assertThat(cleaned).isEqualTo(ptBrEditorialText);
    }

    @Test
    void deveDescartarEntradasQueFiquemVaziasAposSanitizacaoEmListas() {
        List<String> rawList = List.of(
                "<script>evil()</script>",
                "<img src=x onerror=alert(1)>",
                "<b>Combate tático em turnos</b>",
                "   "
        );

        List<String> sanitized = sanitizer.sanitizeList(rawList);

        assertThat(sanitized).containsExactly("Combate tático em turnos");
    }
}
