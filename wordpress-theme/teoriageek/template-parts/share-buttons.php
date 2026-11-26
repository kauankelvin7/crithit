<?php
/**
 * Template Part: Barra de compartilhamento editorial (navigator.share nativo mobile + WhatsApp + X + Copiar Link + Salvar).
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
$tg_title   = teoriageek_clean_title( get_the_title( $tg_pid ) );
$tg_slug    = get_post_field( 'post_name', $tg_pid );

$tg_enc_url   = rawurlencode( (string) $tg_url );
$tg_enc_title = rawurlencode( $tg_title );
$tg_wa_url    = 'https://api.whatsapp.com/send?text=' . rawurlencode( $tg_title . ' - ' . $tg_url );
$tg_tw_url    = 'https://twitter.com/intent/tweet?text=' . $tg_enc_title . '&url=' . $tg_enc_url;
?>
<div class="tg-share-bar flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
	<?php if ( $tg_compact ) : ?>
		<a href="<?php echo esc_url( teoriageek_get_reels_url( $tg_slug ) ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-3 py-1.5 font-sans text-xs font-extrabold uppercase text-ink-highlight">
			<?php echo teoriageek_icon( 'film', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<span><?php esc_html_e( 'Ver em Reels', 'teoriageek' ); ?></span>
		</a>
	<?php endif; ?>

	<button type="button" data-tg-native-share data-share-title="<?php echo esc_attr( $tg_title ); ?>" data-share-url="<?php echo esc_url( $tg_url ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-alt px-3 py-1.5 font-sans text-xs font-bold text-ink-primary hover:border-brand hover:text-brand">
		<?php echo teoriageek_icon( 'share', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span data-tg-share-label><?php esc_html_e( 'Compartilhar', 'teoriageek' ); ?></span>
	</button>

	<a href="<?php echo esc_url( $tg_wa_url ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Compartilhar no WhatsApp', 'teoriageek' ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-alt px-3 py-1.5 font-sans text-xs font-bold text-ink-primary hover:border-brand hover:text-brand">
		<?php echo teoriageek_icon( 'whatsapp', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span>WhatsApp</span>
	</a>

	<?php if ( ! $tg_compact ) : ?>
		<a href="<?php echo esc_url( $tg_tw_url ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Compartilhar no X', 'teoriageek' ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-alt px-3 py-1.5 font-sans text-xs font-bold text-ink-primary hover:border-brand hover:text-brand">
			<?php echo teoriageek_icon( 'twitter', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<span>X</span>
		</a>
	<?php endif; ?>

	<button type="button" data-tg-save-slug="<?php echo esc_attr( $tg_slug ); ?>" aria-pressed="false" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-alt px-3 py-1.5 font-sans text-xs font-bold text-ink-primary hover:border-brand">
		<?php echo teoriageek_icon( 'bookmark', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span data-tg-save-label><?php esc_html_e( 'Salvar', 'teoriageek' ); ?></span>
	</button>

	<button type="button" data-tg-copy-url="<?php echo esc_url( $tg_url ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-alt px-3 py-1.5 font-sans text-xs font-bold text-ink-primary hover:border-brand hover:text-brand">
		<?php echo teoriageek_icon( 'copy', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<span data-tg-copy-label><?php esc_html_e( 'Copiar link', 'teoriageek' ); ?></span>
	</button>
</div>
