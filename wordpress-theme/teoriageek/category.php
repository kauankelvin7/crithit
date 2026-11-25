<?php
/**
 * Arquivo de Categoria Editorial (category.php).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$tg_term  = get_queried_object();
$tg_slug  = ( $tg_term instanceof WP_Term ) ? $tg_term->slug : 'noticias';
$tg_style = teoriageek_get_category_style( $tg_slug );
$tg_sub   = ( $tg_term instanceof WP_Term ) ? get_categories(
	array(
		'parent'     => (int) $tg_term->term_id,
		'hide_empty' => true,
	)
) : array();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php teoriageek_breadcrumb(); ?>

	<header class="mb-8 overflow-hidden rounded-lg border-2 border-border-strong bg-surface shadow-hard">
		<div class="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7" style="<?php echo esc_attr( sprintf( 'background-color:%s;color:%s;', $tg_style['fill'], $tg_style['ink'] ) ); ?>">
			<div>
				<span class="font-mono text-xs font-bold uppercase tracking-widest opacity-90">
					<?php esc_html_e( 'Editoria Oficial', 'teoriageek' ); ?>
				</span>
				<h1 class="mt-0.5 font-headline text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
					<?php echo esc_html( html_entity_decode( single_cat_title( '', false ), ENT_QUOTES, 'UTF-8' ) ); ?>
				</h1>
			</div>
			<?php if ( $tg_term instanceof WP_Term ) : ?>
				<span class="rounded border-2 border-current/30 bg-black/20 px-3 py-1 font-mono text-xs font-bold uppercase">
					<?php echo esc_html( sprintf( _n( '%s matéria', '%s matérias', (int) $tg_term->count, 'teoriageek' ), number_format_i18n( (int) $tg_term->count ) ) ); ?>
				</span>
			<?php endif; ?>
		</div>

		<?php
		$tg_cat_desc = category_description();
		if ( ! empty( $tg_cat_desc ) || ! empty( $tg_sub ) ) :
			?>
			<div class="space-y-3 border-t border-border-subtle bg-surface-alt px-5 py-4 sm:px-7">
				<?php if ( ! empty( $tg_cat_desc ) ) : ?>
					<div class="max-w-3xl font-reading text-sm text-ink-secondary">
						<?php echo wp_kses_post( $tg_cat_desc ); ?>
					</div>
				<?php endif; ?>

				<?php if ( ! empty( $tg_sub ) ) : ?>
					<div class="flex flex-wrap items-center gap-2">
						<span class="font-mono text-[11px] font-bold uppercase text-ink-muted">
							<?php esc_html_e( 'Subeditorias:', 'teoriageek' ); ?>
						</span>
						<?php foreach ( $tg_sub as $tg_child ) : ?>
							<a href="<?php echo esc_url( get_category_link( $tg_child->term_id ) ); ?>" class="rounded border border-border-strong bg-surface px-2.5 py-1 font-mono text-xs font-bold text-ink-primary hover:bg-highlight hover:text-ink-highlight">
								<?php echo esc_html( html_entity_decode( $tg_child->name, ENT_QUOTES, 'UTF-8' ) ); ?>
							</a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</header>

	<?php if ( have_posts() ) : ?>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<?php
			$tg_is_review_cat = in_array( $tg_slug, array( 'criticas', 'reviews', 'hands-on' ), true );
			while ( have_posts() ) :
				the_post();
				get_template_part(
					'template-parts/card-article',
					null,
					array(
						'post'        => get_post(),
						'variant'     => $tg_is_review_cat ? 'review' : 'default',
						'heading_tag' => 'h2',
					)
				);
			endwhile;
			?>
		</div>

		<?php teoriageek_pagination(); ?>
	<?php else : ?>
		<div class="rounded-lg border-2 border-border-strong bg-surface p-10 text-center shadow-hard-sm">
			<p class="font-reading text-base text-ink-secondary">
				<?php esc_html_e( 'Nenhuma matéria publicada foi encontrada nesta editoria.', 'teoriageek' ); ?>
			</p>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="mt-4 inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-highlight px-4 py-2 font-mono text-xs font-bold uppercase text-ink-highlight">
				<?php esc_html_e( 'Voltar para a capa', 'teoriageek' ); ?>
			</a>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
