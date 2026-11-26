<?php
/**
 * Template Part: Card "Próxima Matéria" no fim do artigo (leve, sem infinite scroll automático).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_next = get_previous_post( true );
if ( ! $tg_next instanceof WP_Post ) {
	$tg_next = get_previous_post();
}
if ( ! $tg_next instanceof WP_Post ) {
	return;
}

$tg_np_id    = (int) $tg_next->ID;
$tg_np_cat   = teoriageek_get_primary_category( $tg_np_id );
$tg_np_url   = get_permalink( $tg_np_id );
$tg_np_title = teoriageek_clean_title( get_the_title( $tg_np_id ) );
?>
<nav aria-label="<?php esc_attr_e( 'Próxima matéria recomendada', 'teoriageek' ); ?>" class="mt-8">
	<a href="<?php echo esc_url( $tg_np_url ); ?>" class="editorial-card editorial-card-soft group flex flex-col gap-4 overflow-hidden rounded-sm border border-border-subtle bg-surface p-4 sm:flex-row sm:items-center">
		<div class="w-full shrink-0 overflow-hidden rounded-sm border border-border-subtle sm:w-44">
			<?php
			get_template_part(
				'template-parts/cover-media',
				null,
				array(
					'post_id'      => $tg_np_id,
					'size'         => 'tg-thumb',
					'aspect_class' => 'aspect-[16/9]',
					'decorative'   => true,
				)
			);
			?>
		</div>
		<div class="min-w-0 flex-1 space-y-1.5">
			<div class="flex flex-wrap items-center gap-2">
				<span class="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-widest text-brand">
					<span><?php esc_html_e( 'Próxima Matéria', 'teoriageek' ); ?></span>
					<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</span>
				<?php teoriageek_category_badge( $tg_np_cat, false, 'sm' ); ?>
			</div>
			<h2 class="font-headline text-xl font-extrabold leading-tight tracking-[0.005em] text-ink-primary group-hover:text-brand sm:text-2xl">
				<?php echo esc_html( $tg_np_title ); ?>
			</h2>
			<span class="block font-mono text-xs text-ink-muted">
				<?php echo esc_html( sprintf( __( '%d min de leitura · %s', 'teoriageek' ), teoriageek_get_reading_time( $tg_np_id ), teoriageek_get_relative_date( $tg_np_id ) ) ); ?>
			</span>
		</div>
	</a>
</nav>
