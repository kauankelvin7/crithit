<?php
/**
 * Template Part: Matérias Relacionadas da mesma categoria editorial (consulta otimizada).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_current_id = (int) get_the_ID();
$tg_cat        = teoriageek_get_primary_category( $tg_current_id );

$tg_rel_args = array(
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => 3,
	'post__not_in'        => array( $tg_current_id ),
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
);

if ( $tg_cat ) {
	$tg_rel_args['cat'] = (int) $tg_cat->term_id;
}

$tg_rel_query = new WP_Query( $tg_rel_args );
$tg_related   = $tg_rel_query->posts;

if ( count( $tg_related ) < 3 ) {
	$tg_exclude = array_merge( array( $tg_current_id ), wp_list_pluck( $tg_related, 'ID' ) );
	$tg_fb      = new WP_Query(
		array(
			'post_type'           => 'post',
			'post_status'         => 'publish',
			'posts_per_page'      => 3 - count( $tg_related ),
			'post__not_in'        => $tg_exclude,
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);
	$tg_related = array_merge( $tg_related, $tg_fb->posts );
}

if ( empty( $tg_related ) ) {
	return;
}
?>
<section aria-labelledby="tg-related-heading" class="mt-10">
	<div class="mb-5 flex items-end justify-between border-b-[3px] border-border-strong pb-2">
		<div>
			<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
				<?php esc_html_e( 'Continue Lendo', 'teoriageek' ); ?>
			</p>
			<h2 id="tg-related-heading" class="font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-3xl">
				<?php esc_html_e( 'Matérias Relacionadas', 'teoriageek' ); ?>
			</h2>
		</div>
	</div>

	<div class="grid gap-5 sm:grid-cols-3">
		<?php foreach ( $tg_related as $tg_rel_post ) : ?>
			<?php
			get_template_part(
				'template-parts/card-article',
				null,
				array(
					'post'        => $tg_rel_post,
					'variant'     => 'compact-grid',
					'heading_tag' => 'h3',
				)
			);
			?>
		<?php endforeach; ?>
	</div>
</section>
