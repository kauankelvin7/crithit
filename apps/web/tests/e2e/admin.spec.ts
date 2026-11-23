import { expect, test } from '@playwright/test';
import { setupApiMocks } from './helpers/mock-api';

test.describe('Fluxo 4 — Painel Admin (/admin)', () => {
  test('bloqueia acesso sem sessão, autentica via BFF com cookie HttpOnly e sem JWT em localStorage', async ({
    page,
    context,
  }) => {
    await setupApiMocks(page, { authenticated: false });
    await page.goto('/admin');

    // Sem sessão: exibe tela de login e não expõe dados da fila
    await expect(page.getByRole('heading', { name: 'Painel da Redação' })).toBeVisible();
    await expect(page.getByText('Mesa Editorial CritHit!')).toHaveCount(0);

    // Submete credenciais válidas
    await page.getByLabel('E-mail editorial').fill('editor@crithit.com.br');
    await page.getByLabel('Senha').fill('CritHit#2026');
    await page.getByRole('button', { name: 'Entrar na Redação' }).click();

    await expect(page.getByRole('heading', { name: 'Mesa Editorial CritHit!' })).toBeVisible();

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

  test('Fila de Revisão split-screen: bloqueia javascript:, aprova/publica, agenda e descarta em 2 passos', async ({
    page,
  }) => {
    await setupApiMocks(page, { authenticated: true });
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Mesa Editorial CritHit!' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Fila de Revisão \(3\)/i })).toBeVisible();

    // Split-screen: Origem RSS / IA (esquerda) + Formulário (direita)
    await expect(page.getByRole('region', { name: 'Fonte original e fontes cruzadas' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Formulário de revisão editorial' })).toBeVisible();

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
    const sourceUrlInput = page.getByLabel('URL da Fonte Original (http/https)');
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

  test('Matérias Publicadas: editar autor/fonte, promover para Manchete Principal, Tirar do ar em 2 passos e Republicar', async ({
    page,
  }) => {
    await setupApiMocks(page, { authenticated: true });
    await page.goto('/admin');

    await page.getByRole('tab', { name: /Matérias Publicadas/i }).click();

    // 1) Editar autor e fonte da primeira matéria
    await page.getByRole('button', { name: 'Editar' }).first().click();
    await expect(page.getByText(/Editando: PUBLISHED/i)).toBeVisible();

    await page.getByLabel('Autor / Revisor (author_name)').fill('Kauan QA Editor');
    await page.getByLabel('Nome da Fonte (source_name)').fill('Gematsu Verified');
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
    await expect(page.getByText('UNPUBLISHED')).toBeVisible();

    // 4) Republicar
    await page.getByRole('button', { name: 'Republicar' }).first().click();
    await expect(page.getByRole('status')).toContainText(/Matéria republicada com sucesso/i);
    await expect(page.getByText('UNPUBLISHED')).toHaveCount(0);
  });
});
