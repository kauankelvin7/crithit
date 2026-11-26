<?php
/**
 * Área de Comentários (comments.php) — Compatível com WordPress nativo e Disqus.
 * Quando o plugin Disqus está ativo em produção, ele intercepta automaticamente `comments_template`.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( post_password_required() ) {
	return;
}

$tg_comment_count = (int) get_comments_number();
?>
<section id="comments" aria-labelledby="tg-comments-heading" class="tgx-comments-section mt-8 rounded-lg border border-border-subtle bg-surface p-4 sm:p-7">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
		<h2 id="tg-comments-heading" class="inline-flex items-center gap-2 font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary">
			<span class="text-brand"><?php echo teoriageek_icon( 'message', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
			<?php
			if ( $tg_comment_count > 0 ) {
				echo esc_html( sprintf( _n( '%s Comentário', '%s Comentários', $tg_comment_count, 'teoriageek' ), number_format_i18n( $tg_comment_count ) ) );
			} else {
				esc_html_e( 'Comentários da Comunidade', 'teoriageek' );
			}
			?>
		</h2>
	</div>

	<?php if ( have_comments() ) : ?>
		<ol class="tg-comment-list space-y-5 mb-8">
			<?php
			wp_list_comments(
				array(
					'style'       => 'ol',
					'short_ping'  => true,
					'avatar_size' => 44,
				)
			);
			?>
		</ol>

		<?php the_comments_navigation(); ?>
	<?php endif; ?>

	<?php if ( ! comments_open() && $tg_comment_count > 0 && post_type_supports( get_post_type(), 'comments' ) ) : ?>
		<p class="font-mono text-xs text-ink-muted">
			<?php esc_html_e( 'Os comentários estão encerrados para esta publicação.', 'teoriageek' ); ?>
		</p>
	<?php endif; ?>

	<?php
	comment_form(
		array(
			'class_container'    => 'tg-comment-respond',
			'title_reply'        => __( 'Deixe seu comentário', 'teoriageek' ),
			'title_reply_before' => '<h3 id="reply-title" class="mb-4 font-headline text-xl font-extrabold uppercase tracking-wide text-ink-primary">',
			'title_reply_after'  => '</h3>',
			'class_submit'       => 'tgx-comment-submit cursor-pointer rounded-sm bg-brand-fill px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90',
			'label_submit'       => __( 'Publicar comentário', 'teoriageek' ),
		)
	);
	?>
</section>
