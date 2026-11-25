<?php
/**
 * Template Part: Mídia de capa com proporção fixa anti-CLS e fallback vetorial Pop-Art.
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
$tg_title    = html_entity_decode( get_the_title( $tg_post_id ), ENT_QUOTES, 'UTF-8' );
$tg_img_url  = get_the_post_thumbnail_url( $tg_post_id, $tg_size );
?>
<div class="tg-cover-wrap relative overflow-hidden bg-chrome <?php echo esc_attr( $tg_aspect ); ?>">
	<?php if ( $tg_img_url ) : ?>
		<div class="tg-cover-fallback pointer-events-none absolute inset-0 hidden">
			<?php echo teoriageek_render_fallback_art( $tg_cat_slug, false ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		</div>
		<img
			src="<?php echo esc_url( $tg_img_url ); ?>"
			alt="<?php echo $tg_decorative ? '' : esc_attr( $tg_title ); ?>"
			<?php echo $tg_decorative ? 'aria-hidden="true"' : ''; ?>
			loading="<?php echo $tg_priority ? 'eager' : 'lazy'; ?>"
			<?php echo $tg_priority ? 'fetchpriority="high"' : ''; ?>
			decoding="async"
			class="tg-cover-img editorial-cover-media relative z-10 h-full w-full object-cover object-center"
		/>
	<?php else : ?>
		<?php echo teoriageek_render_fallback_art( $tg_cat_slug, false ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	<?php endif; ?>
</div>
