<?php
/**
 * Hub / Dossiê da Taxonomia Nativa `universo` (/universo/...).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$tg_term = get_queried_object();
$tg_sub  = ( $tg_term instanceof WP_Term ) ? get_terms(
	array(
		'taxonomy'   => 'universo',
		'parent'     => (int) $tg_term->term_id,
		'hide_empty' => true,
	)
) : array();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php teoriageek_breadcrumb(); ?>

	<header data-chrome="dark" class="mb-8 overflow-hidden rounded-lg border-2 border-border-strong bg-chrome p-6 text-chrome-ink shadow-hard sm:p-8">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="space-y-2">
				<span class="inline-block rounded bg-highlight px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink-highlight">
					<?php esc_html_e( 'Hub & Dossiê Universo', 'teoriageek' ); ?>
				</span>
				<h1 class="font-headline text-3xl font-extrabold uppercase tracking-[0.005em] text-white sm:text-5xl">
					<?php echo esc_html( single_term_title( '', false ) ); ?>
				</h1>
				<?php
				$tg_desc = term_description();
				if ( ! empty( $tg_desc ) ) :
					?>
					<div class="max-w-3xl font-reading text-sm leading-relaxed text-chrome-muted sm:text-base">
						<?php echo wp_kses_post( $tg_desc ); ?>
					</div>
				<?php endif; ?>
			</div>

			<?php if ( $tg_term instanceof WP_Term ) : ?>
				<span class="rounded border border-white/20 bg-chrome-surface px-3 py-1 font-mono text-xs font-bold uppercase text-highlight">
					<?php echo esc_html( sprintf( _n( '%s matéria no dossiê', '%s matérias no dossiê', (int) $tg_term->count, 'teoriageek' ), number_format_i18n( (int) $tg_term->count ) ) ); ?>
				</span>
			<?php endif; ?>
		</div>

		<?php if ( ! empty( $tg_sub ) && ! is_wp_error( $tg_sub ) ) : ?>
			<div class="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
				<span class="font-mono text-[11px] font-bold uppercase text-chrome-muted">
					<?php esc_html_e( 'Sub-universos:', 'teoriageek' ); ?>
				</span>
				<?php foreach ( $tg_sub as $tg_child ) : ?>
					<a href="<?php echo esc_url( get_term_link( $tg_child ) ); ?>" class="rounded border border-white/20 bg-chrome-surface px-2.5 py-1 font-mono text-xs font-bold text-chrome-ink hover:border-highlight hover:text-highlight">
						<?php echo esc_html( $tg_child->name ); ?>
					</a>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</header>

	<?php if ( have_posts() ) : ?>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part(
					'template-parts/card-article',
					null,
					array(
						'post'        => get_post(),
						'heading_tag' => 'h2',
					)
				);
			endwhile;
			?>
		</div>
		<?php teoriageek_pagination(); ?>
	<?php else : ?>
		<div class="rounded-lg border border-border-subtle bg-surface p-10 text-center shadow-sm">
			<p class="font-reading text-base text-ink-secondary">
				<?php esc_html_e( 'Nenhuma matéria publicada neste universo ainda.', 'teoriageek' ); ?>
			</p>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
