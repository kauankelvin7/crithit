<?php
/**
 * Template Part: Botões de compartilhamento e engajamento editorial na matéria.
 *
 * @package TeoriaGeek
 * @var array $args { post_id?: int, compact?: bool }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_pid     = isset( $args['post_id'] ) ? (int) $args['post_id'] : (int) get_the_ID();
$tg_compact = ! empty( $args['compact'] );
$tg_url     = get_permalink( $tg_pid );
$tg_title   = html_entity_decode( get_the_title( $tg_pid ), ENT_QUOTES, 'UTF-8' );
$tg_slug    = get_post_field( 'post_name', $tg_pid );

$tg_enc_url   = rawurlencode( (string) $tg_url );
$tg_enc_title = rawurlencode( $tg_title );
$tg_wa_url    = 'https://api.whatsapp.com/send?text=' . rawurlencode( $tg_title . ' - ' . $tg_url );
$tg_tw_url    = 'https://twitter.com/intent/tweet?text=' . $tg_enc_title . '&url=' . $tg_enc_url;
$tg_fb_url    = 'https://www.facebook.com/sharer/sharer.php?u=' . $tg_enc_url;
?>
<div class="flex flex-wrap items-center gap-2">
	<?php if ( $tg_compact ) : ?>
		<a href="<?php echo esc_url( teoriageek_get_reels_url( $tg_slug ) ); ?>" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-highlight px-3 py-2 font-mono text-xs font-bold uppercase text-ink-highlight shadow-hard-sm">
			<?php echo teoriageek_icon( 'film', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<span><?php esc_html_e( 'Ver em Reels', 'teoriageek' ); ?></span>
		</a>
	<?php endif; ?>

	<a href="<?php echo esc_url( $tg_wa_url ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Compartilhar no WhatsApp', 'teoriageek' ); ?>" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface px-3 py-2 font-mono text-xs font-bold text-ink-primary hover:bg-surface-alt">
		<?php echo teoriageek_icon( 'whatsapp', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span>WhatsApp</span>
	</a>

	<a href="<?php echo esc_url( $tg_tw_url ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Compartilhar no X / Twitter', 'teoriageek' ); ?>" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface px-3 py-2 font-mono text-xs font-bold text-ink-primary hover:bg-surface-alt">
		<?php echo teoriageek_icon( 'twitter', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span class="hidden sm:inline">X</span>
	</a>

	<?php if ( ! $tg_compact ) : ?>
		<a href="<?php echo esc_url( $tg_fb_url ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Compartilhar no Facebook', 'teoriageek' ); ?>" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface px-3 py-2 font-mono text-xs font-bold text-ink-primary hover:bg-surface-alt">
			<?php echo teoriageek_icon( 'facebook', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<span>Facebook</span>
		</a>
	<?php endif; ?>

	<button type="button" data-tg-save-slug="<?php echo esc_attr( $tg_slug ); ?>" aria-pressed="false" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface px-3 py-2 font-mono text-xs font-bold text-ink-primary hover:bg-surface-alt">
		<?php echo teoriageek_icon( 'bookmark', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span data-tg-save-label><?php esc_html_e( 'Salvar', 'teoriageek' ); ?></span>
	</button>

	<button type="button" data-tg-copy-url="<?php echo esc_url( $tg_url ); ?>" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface px-3 py-2 font-mono text-xs font-bold text-ink-primary hover:bg-surface-alt">
		<?php echo teoriageek_icon( 'share', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span data-tg-copy-label><?php esc_html_e( 'Copiar link', 'teoriageek' ); ?></span>
	</button>
</div>
