import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentsDrawer } from '@/components/reels/CommentsDrawer';
import * as commentsApi from '@/lib/comments-api';

describe('CommentsDrawer — Lista, escape XSS, validação de formulário e tecla Escape', () => {
  const articleId = '10000000-0000-4000-8000-000000000001';
  const triggerRef = createRef<HTMLButtonElement>();

  beforeEach(() => {
    vi.spyOn(commentsApi, 'fetchArticleComments').mockResolvedValue([
      {
        id: 'comment-xss-1',
        articleId,
        authorDisplayName: 'Marina <script>alert(1)</script>',
        body: '<img src=x onerror=alert(1)> Excelente análise do motor RE Engine!',
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza comentários escapando tentativas de XSS como texto puro sem injetar tags HTML', async () => {
    const { container } = render(
      <CommentsDrawer
        open={true}
        articleId={articleId}
        articleHeadline="Capcom confirma remake de Dino Crisis"
        triggerRef={triggerRef}
        onClose={vi.fn()}
        onCommentAdded={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/<img src=x onerror=alert\(1\)> Excelente análise do motor RE Engine!/i),
      ).toBeInTheDocument();
    });

    // Garante que nenhuma tag <img> ou <script> foi criada pelo payload do comentário
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog?.querySelector('img')).toBeNull();
    expect(dialog?.querySelector('script')).toBeNull();
  });

  it('valida tamanho mínimo e máximo no formulário antes de enviar', async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(commentsApi, 'postArticleComment');

    render(
      <CommentsDrawer
        open={true}
        articleId={articleId}
        articleHeadline="Capcom confirma remake de Dino Crisis"
        triggerRef={triggerRef}
        onClose={vi.fn()}
        onCommentAdded={vi.fn()}
      />,
    );

    const nameInput = await screen.findByLabelText(/seu nome/i);
    const bodyInput = screen.getByLabelText(/^comentário$/i);
    const submitBtn = screen.getByRole('button', { name: /publicar comentário/i });

    // Nome muito curto (< 2 caracteres)
    await user.type(nameInput, 'A');
    await user.type(bodyInput, 'Comentário válido');
    await user.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/pelo menos 2 caracteres/i);
    expect(postSpy).not.toHaveBeenCalled();

    // Comentário muito curto (< 3 caracteres)
    await user.clear(nameInput);
    await user.type(nameInput, 'Lucas M.');
    await user.clear(bodyInput);
    await user.type(bodyInput, 'Oi');
    await user.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(
      new RegExp(`entre 3 e ${commentsApi.MAX_COMMENT_BODY_LENGTH} caracteres`, 'i'),
    );
    expect(postSpy).not.toHaveBeenCalled();

    // Validação direta do limite máximo (> 500 caracteres)
    const tooLong = 'x'.repeat(commentsApi.MAX_COMMENT_BODY_LENGTH + 1);
    const maxCheck = commentsApi.validateCommentInput('Lucas M.', tooLong);
    expect(maxCheck.valid).toBe(false);
  });

  it('fecha o drawer ao pressionar a tecla Escape', async () => {
    const onClose = vi.fn();

    render(
      <CommentsDrawer
        open={true}
        articleId={articleId}
        articleHeadline="Capcom confirma remake de Dino Crisis"
        triggerRef={triggerRef}
        onClose={onClose}
        onCommentAdded={vi.fn()}
      />,
    );

    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
