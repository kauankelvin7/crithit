<?php
/**
 * Template Part: Faixa deslizante "Plantão Geek" do Teoria Geek (com margem e fade suaves).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_ticker_posts = ( isset( $args['posts'] ) && is_array( $args['posts'] ) ) ? $args['posts'] : array();

if ( empty( $tg_ticker_posts ) ) {
	$tg_plantao_query = new WP_Query(
		array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => 8,
			'ignore_sticky_posts' => true,
			'meta_key'            => '_tg_plantao',
			'meta_value'          => '1',
			'no_found_rows'       => true,
		)
	);

	$tg_ticker_posts = $tg_plantao_query->posts;

	if ( count( $tg_ticker_posts ) < 8 ) {
		$tg_cat_news = teoriageek_get_mapped_category_slug( 'noticias' );
		$tg_already  = wp_list_pluck( $tg_ticker_posts, 'ID' );
		$tg_fb_args  = array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => 8 - count( $tg_ticker_posts ),
			'post__not_in'        => $tg_already,
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		);
		if ( '' !== $tg_cat_news && get_category_by_slug( $tg_cat_news ) ) {
			$tg_fb_args['category_name'] = $tg_cat_news;
		}
		$tg_fb_query     = new WP_Query( $tg_fb_args );
		$tg_ticker_posts = array_merge( $tg_ticker_posts, $tg_fb_query->posts );
	}
}

if ( empty( $tg_ticker_posts ) ) {
	return;
}
?>
<section aria-label="<?php esc_attr_e( 'Plantão Geek — Últimas notícias', 'teoriageek' ); ?>" class="ticker-marquee relative z-10 w-full border-b border-border-subtle bg-surface-alt">
	<div class="mx-auto flex w-full max-w-7xl items-stretch px-0 sm:px-4">
		<div class="z-10 flex shrink-0 items-center gap-2 bg-brand-fill px-3.5 py-2 text-white sm:rounded-l-none sm:px-4">
			<?php echo teoriageek_icon( 'zap', 'h-3.5 w-3.5 shrink-0 text-highlight' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<span class="font-display text-sm tracking-wider sm:text-base"><?php esc_html_e( 'PLANTÃO GEEK', 'teoriageek' ); ?></span>
		</div>

		<div class="ticker-viewport relative flex-1 overflow-hidden px-4 py-2">
			<div class="ticker-track items-center">
				<?php foreach ( $tg_ticker_posts as $tg_item ) : ?>
					<?php $tg_item_cat = teoriageek_get_primary_category( $tg_item->ID ); ?>
					<a href="<?php echo esc_url( get_permalink( $tg_item->ID ) ); ?>" class="inline-flex shrink-0 items-center gap-2 pr-8 font-sans text-xs font-semibold text-ink-primary hover:text-brand sm:text-sm">
						<?php teoriageek_category_badge( $tg_item_cat, false, 'sm' ); ?>
						<span class="whitespace-nowrap"><?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_item->ID ) ) ); ?></span>
					</a>
				<?php endforeach; ?>

				<?php foreach ( $tg_ticker_posts as $tg_clone ) : ?>
					<?php $tg_clone_cat = teoriageek_get_primary_category( $tg_clone->ID ); ?>
					<a href="<?php echo esc_url( get_permalink( $tg_clone->ID ) ); ?>" aria-hidden="true" tabindex="-1" class="ticker-clone inline-flex shrink-0 items-center gap-2 pr-8 font-sans text-xs font-semibold text-ink-primary hover:text-brand sm:text-sm">
						<?php teoriageek_category_badge( $tg_clone_cat, false, 'sm' ); ?>
						<span class="whitespace-nowrap"><?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_clone->ID ) ) ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>
	</div>
</section>
