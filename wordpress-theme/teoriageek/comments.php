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
<section id="comments" aria-labelledby="tg-comments-heading" class="mt-8 rounded-lg border-2 border-border-strong bg-surface p-5 shadow-hard sm:p-8">
	<div class="mb-6 flex items-center justify-between border-b-2 border-border-strong pb-3">
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
			'class_submit'       => 'tactile-btn cursor-pointer rounded border-2 border-border-strong bg-highlight px-5 py-2.5 font-mono text-xs font-bold uppercase text-ink-highlight shadow-hard-sm',
			'label_submit'       => __( 'Publicar comentário', 'teoriageek' ),
		)
	);
	?>
</section>
