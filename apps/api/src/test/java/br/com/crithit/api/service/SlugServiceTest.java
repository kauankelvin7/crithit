package br.com.crithit.api.service;

import br.com.crithit.api.repository.ArticleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlugServiceTest {

    @Mock
    private ArticleRepository articleRepository;

    private SlugService slugService;

    @BeforeEach
    void setUp() {
        slugService = new SlugService(articleRepository);
    }

    @Test
    void deveNormalizarAcentosCaracteresEspeciaisEEspacosParaKebabCaseLimpo() {
        String raw = "  Análise: Épico de Ficção Científica & Ação (2027) — Nota 10/10!  ";

        String slug = slugService.slugify(raw);

        assertThat(slug).isEqualTo("analise-epico-de-ficcao-cientifica-acao-2027-nota-10-10");
        assertThat(slugService.slugify("   ")).isEqualTo("materia-crithit");
        assertThat(slugService.slugify("@@@###!!!")).isEqualTo("materia-crithit");
    }

    @Test
    void deveResolverColisoesAdicionandoSufixoIncrementalQuandoSlugJaExistir() {
        String baseSlug = "capcom-anuncia-novo-resident-evil";
        when(articleRepository.existsBySlug(baseSlug)).thenReturn(true);
        when(articleRepository.existsBySlug(baseSlug + "-2")).thenReturn(true);
        when(articleRepository.existsBySlug(baseSlug + "-3")).thenReturn(false);

        String unique = slugService.generateUniqueSlug("Capcom anuncia novo Resident Evil!");

        assertThat(unique).isEqualTo("capcom-anuncia-novo-resident-evil-3");
    }

    @Test
    void deveManterSlugAtualEmAtualizacaoSemColisaoComProprioArtigo() {
        String current = "dino-crisis-remake-2027";
        String preserved = slugService.ensureUniqueSlugForUpdate("Dino Crisis Remake 2027", current);

        assertThat(preserved).isEqualTo(current);
    }
}
