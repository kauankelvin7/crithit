<?php
/**
 * Template Part: Reação rápida de 1 clique no fim do artigo ("Curtiu a matéria?").
 * Compartilha o mesmo contador persistido em `_tg_likes_count` e `teoriageek-liked-ids` dos Reels,
 * oferecendo engajamento de baixíssimo atrito sem exigir login.
 *
 * @package TeoriaGeek
 * @var array $args { post_id?: int }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_pid = isset( $args['post_id'] ) ? (int) $args['post_id'] : (int) get_the_ID();
if ( $tg_pid <= 0 ) {
	return;
}

$tg_likes = teoriageek_get_post_likes( $tg_pid );
?>
<div class="tg-article-react" data-tg-article-react="<?php echo esc_attr( (string) $tg_pid ); ?>">
	<div class="tg-article-react-copy">
		<span class="tg-article-react-title"><?php esc_html_e( 'Curtiu esta matéria?', 'teoriageek' ); ?></span>
		<span class="tg-article-react-sub"><?php esc_html_e( 'Deixe seu voto para ajudar a redação a trazer mais conteúdos assim.', 'teoriageek' ); ?></span>
	</div>
	<button
		type="button"
		data-tg-article-like="<?php echo esc_attr( (string) $tg_pid ); ?>"
		aria-pressed="false"
		class="tg-article-react-btn"
	>
		<?php echo teoriageek_icon( 'heart', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span data-tg-react-label><?php esc_html_e( 'Curtir', 'teoriageek' ); ?></span>
		<span data-tg-react-count class="tg-article-react-count"><?php echo esc_html( (string) $tg_likes ); ?></span>
	</button>
</div>
