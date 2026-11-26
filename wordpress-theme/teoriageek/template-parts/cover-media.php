<?php
/**
 * Template Part: Mídia de capa com proporção fixa anti-CLS, tratamento para capas antigas pequenas
 * e fallback vetorial Pop-Art.
 *
 * @package TeoriaGeek
 * @var array $args { post_id?: int, size?: string, aspect_class?: string, priority?: bool, decorative?: bool }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_post_id    = isset( $args['post_id'] ) ? (int) $args['post_id'] : (int) get_the_ID();
$tg_size       = isset( $args['size'] ) ? (string) $args['size'] : 'tg-card';
$tg_aspect     = isset( $args['aspect_class'] ) ? (string) $args['aspect_class'] : 'aspect-[16/9]';
$tg_priority   = ! empty( $args['priority'] );
$tg_decorative = ! empty( $args['decorative'] );

$tg_cat      = teoriageek_get_primary_category( $tg_post_id );
$tg_cat_slug = $tg_cat ? $tg_cat->slug : 'noticias';
$tg_title    = teoriageek_clean_title( get_the_title( $tg_post_id ) );
$tg_thumb_id = (int) get_post_thumbnail_id( $tg_post_id );
$tg_img_url  = $tg_thumb_id > 0 ? (string) get_the_post_thumbnail_url( $tg_post_id, $tg_size ) : '';

// Detecta capas antigas muito pequenas (< 520px de largura) para evitar pixelização em slots largos.
$tg_is_small_legacy = false;
if ( $tg_thumb_id > 0 && 'tg-thumb' !== $tg_size ) {
	$tg_meta = wp_get_attachment_metadata( $tg_thumb_id );
	if ( is_array( $tg_meta ) && ! empty( $tg_meta['width'] ) && (int) $tg_meta['width'] < 520 ) {
		$tg_is_small_legacy = true;
	}
}
?>
<div class="tg-cover-wrap relative overflow-hidden bg-chrome <?php echo esc_attr( $tg_aspect ); ?>">
	<?php if ( '' !== $tg_img_url ) : ?>
		<div class="tg-cover-fallback pointer-events-none absolute inset-0 hidden">
			<?php echo teoriageek_render_fallback_art( $tg_cat_slug, false ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</div>
		<?php if ( $tg_is_small_legacy ) : ?>
			<img
				src="<?php echo esc_url( $tg_img_url ); ?>"
				alt=""
				aria-hidden="true"
				loading="lazy"
				decoding="async"
				class="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-xl"
			/>
		<?php endif; ?>
		<img
			src="<?php echo esc_url( $tg_img_url ); ?>"
			alt="<?php echo $tg_decorative ? '' : esc_attr( $tg_title ); ?>"
			<?php echo $tg_decorative ? 'aria-hidden="true"' : ''; ?>
			loading="<?php echo $tg_priority ? 'eager' : 'lazy'; ?>"
			<?php echo $tg_priority ? 'fetchpriority="high"' : ''; ?>
			decoding="async"
			class="tg-cover-img editorial-cover-media relative z-10 h-full w-full <?php echo $tg_is_small_legacy ? 'object-contain p-2' : 'object-cover object-center'; ?>"
		/>
	<?php else : ?>
		<?php echo teoriageek_render_fallback_art( $tg_cat_slug, false ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<?php endif; ?>
</div>
