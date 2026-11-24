import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

test.describe('Fluxo 4 — Painel Admin (/admin)', () => {
  test('isola completamente o /admin sem header/footer públicos, autentica via BFF com cookie HttpOnly e sem JWT em localStorage', async ({
    page,
    context,
  }) => {
    await setupApiMocks(page, { authenticated: false });
    await page.goto('/admin');

    // Isolamento total: cabeçalho dedicado da Redação, sem barra de busca pública, sem Reels, sem footer público
    await expect(page.locator('header[data-admin-header="true"]')).toBeVisible();
    await expect(page.locator('header')).toContainText('REDAÇÃO');
    await expect(page.getByLabel('Buscar notícias')).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCount(0);

    // Sem sessão: exibe tela de login e não expõe dados da fila
    await expect(page.getByRole('heading', { name: 'Painel da Redação' })).toBeVisible();
    await expect(page.getByText('Mesa Editorial CritHit!')).toHaveCount(0);

    // Submete credenciais válidas
    await page.getByLabel('E-mail editorial').fill('editor@crithit.com.br');
    await page.getByLabel('Senha').fill('CritHit#2026');
    await page.getByRole('button', { name: 'Entrar na Redação' }).click();

    await expect(page.getByRole('heading', { name: 'Mesa Editorial CritHit!' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Human-in-the-Loop');
    await expect(page.locator('body')).not.toContainText('raw_title');
    await expect(page.locator('body')).not.toContainText('pgvector');

    // Verifica cookie HttpOnly no contexto do navegador
    const cookies = await context.cookies();
    const accessCookie = cookies.find((c) => c.name === 'crithit_access_token');
    expect(accessCookie).toBeDefined();
    expect(accessCookie?.httpOnly).toBe(true);

    // Verifica ausência de JWT em localStorage
    const localStorageEntries = await page.evaluate(() => {
      const entries: Array<[string, string]> = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          entries.push([key, window.localStorage.getItem(key) ?? '']);
        }
      }
      return entries;
    });

    for (const [key, value] of localStorageEntries) {
      expect(key.toLowerCase()).not.toContain('token');
      expect(key.toLowerCase()).not.toContain('jwt');
      expect(value).not.toContain('eyJ');
    }
  });

  test('Fila de Revisão split-screen: Preview Reels, bloqueia javascript:, aprova/publica, agenda e descarta em 2 passos', async ({
    page,
  }) => {
    await setupApiMocks(page, { authenticated: true });
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Mesa Editorial CritHit!' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Fila de Revisão \(3\)/i })).toBeVisible();

    // Split-screen: Origem da Pauta (esquerda) + Formulário (direita) sem jargões
    const leftPane = page.getByRole('region', { name: 'Fonte original e fontes cruzadas' });
    await expect(leftPane).toBeVisible();
    await expect(leftPane).toContainText('Título original');
    await expect(leftPane).toContainText('Resumo original');
    await expect(leftPane).toContainText('IA: Adaptado');
    await expect(leftPane).toContainText('Fontes cruzadas (2)');
    await expect(page.getByRole('region', { name: 'Formulário de revisão editorial' })).toBeVisible();

    // Preview Reels ao vivo
    await page.getByRole('button', { name: /Preview Reels/i }).click();
    await expect(page.getByLabel('Pré-visualização ao vivo do Reel')).toBeVisible();
    await page.getByRole('button', { name: '2. Em 10s' }).click();
    await expect(page.getByLabel('Pré-visualização ao vivo do Reel')).toContainText('Em 10 segundos');
    await page.getByRole('button', { name: /Ocultar Preview Reels/i }).click();

    // Preview ao vivo da capa + upload de imagem local
    await expect(page.getByLabel('Pré-visualização da capa editorial')).toBeVisible();
    await page.getByLabel('Selecionar arquivo de imagem para capa').setInputFiles({
      name: 'capa-teste.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    await expect(page.getByLabel(/URL da Imagem de Capa/i)).toHaveValue(/\/api\/media\/mock-upload\.png$/);

    // 1) Bloqueio de URL javascript:
    const sourceUrlInput = page.getByLabel('URL da Fonte Original');
    await sourceUrlInput.fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Aprovar e Publicar' }).click();

    await expect(sourceUrlInput).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/http:\/\/ ou https:\/\//i)).toBeVisible();

    // Corrige URL e aprova/publica item 1
    await sourceUrlInput.fill('https://www.gematsu.com/fromsoftware-new-trademark-2026');
    await page.getByRole('button', { name: 'Aprovar e Publicar' }).click();

    await expect(page.getByRole('status')).toContainText(/Matéria aprovada e publicada/i);
    await expect(page.getByRole('tab', { name: /Fila de Revisão \(2\)/i })).toBeVisible();

    // 2) Agendar item 2 com data futura
    const futureDate = new Date(Date.now() + 48 * 3_600_000);
    const localDatetime = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(futureDate.getDate()).padStart(2, '0')}T14:30`;

    await page.getByLabel('Agendar Publicação Futura').fill(localDatetime);
    await page.getByRole('button', { name: 'Agendar' }).click();

    await expect(page.getByRole('status')).toContainText(/Publicação agendada/i);
    await expect(page.getByRole('tab', { name: /Fila de Revisão \(1\)/i })).toBeVisible();

    // 3) Descartar item 3 em 2 passos
    await page.getByRole('button', { name: 'Descartar' }).click();
    const discardDialog = page.getByRole('alertdialog');
    await expect(discardDialog).toBeVisible();
    await expect(discardDialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    await discardDialog.getByLabel('Motivo do descarte').fill('Rumor sem confirmação oficial');
    await discardDialog.getByRole('button', { name: 'Confirmar descarte' }).click();

    await expect(page.getByRole('status')).toContainText(/Rascunho descartado/i);
    await expect(page.getByRole('tab', { name: /Fila de Revisão \(0\)/i })).toBeVisible();
  });

  test('Nova Matéria Autoral + Aba Matérias Publicadas (Agendadas, editar, promover, Tirar do ar e Republicar)', async ({
    page,
  }) => {
    await setupApiMocks(page, { authenticated: true });
    await page.goto('/admin');

    // 0) Criar Nova Matéria Autoral e publicar imediatamente
    await page.getByRole('button', { name: /Nova Matéria Autoral/i }).click();
    await expect(page.getByRole('heading', { name: 'Nova Matéria Autoral' })).toBeVisible();
    await page
      .getByLabel('Manchete Editorial')
      .fill('Especial CritHit!: os 5 RPGs independentes mais criativos de 2026');
    await page
      .getByLabel('Lead (Abertura)')
      .fill('Selecionamos cinco projetos autorais que redefinem sistemas de combate por turnos.');
    await page
      .getByLabel(/Corpo da Matéria/i)
      .fill('A cena independente entregou algumas das experiências mais memoráveis do ano.');
    await page
      .getByLabel('Resumo para Reels')
      .fill('Cinco RPGs independentes que estão elevando o gênero tático em 2026.');
    await page.getByRole('button', { name: 'Publicar matéria' }).click();

    await expect(page.getByRole('status')).toContainText(/Matéria autoral criada e publicada/i);

    // Já estamos na aba Matérias Publicadas — testar filtro Agendadas + cancelar agendamento
    await page.getByRole('button', { name: /Agendadas \(1\)/i }).click();
    await expect(page.getByText(/Duna: Messias encerra filmagens/i)).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await expect(page.getByRole('status')).toContainText(/Agendamento cancelado/i);

    // Voltar para Publicadas
    await page.getByRole('button', { name: /^Publicadas/i }).click();

    // 1) Editar autor e fonte da primeira matéria
    await page.getByRole('button', { name: 'Editar' }).first().click();
    await expect(page.getByText(/Editando: Publicada/i)).toBeVisible();

    await page.getByLabel('Autor / Revisor').fill('Kauan QA Editor');
    await page.getByLabel('Tipo de Conteúdo').selectOption('CURADORIA');
    await page.getByLabel('Nome da Fonte').fill('Gematsu Verified');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByRole('status')).toContainText(/Alterações salvas com sucesso/i);
    await page.getByRole('button', { name: /Voltar para a listagem/i }).click();

    await expect(page.getByText('Por Kauan QA Editor')).toBeVisible();
    await expect(page.getByText('Fonte: Gematsu Verified')).toBeVisible();

    // 2) Promover segunda matéria para Manchete Principal
    const promoteBtn = page.getByRole('button', { name: 'Definir como Manchete Principal' }).first();
    await expect(promoteBtn).toBeVisible();
    await promoteBtn.click();

    await expect(page.getByRole('status')).toContainText(/Manchete Principal da Home atualizada/i);

    // 3) Tirar do ar em 2 passos
    await page.getByRole('button', { name: 'Tirar do ar' }).first().click();
    const unpublishDialog = page.getByRole('alertdialog', { name: 'Confirmar retirada do ar' });
    await expect(unpublishDialog).toBeVisible();
    await expect(unpublishDialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    await unpublishDialog.getByLabel('Motivo da retirada do ar').fill('Revisão editorial temporária');
    await unpublishDialog.getByRole('button', { name: 'Confirmar retirada do ar' }).click();

    await expect(page.getByRole('status')).toContainText(/Matéria retirada do ar/i);
    await expect(page.getByText('Retirada do ar', { exact: true }).first()).toBeVisible();

    // 4) Republicar
    await page.getByRole('button', { name: 'Republicar' }).first().click();
    await expect(page.getByRole('status')).toContainText(/Matéria republicada com sucesso/i);
    await expect(page.getByText('Retirada do ar', { exact: true })).toHaveCount(0);
  });
});
