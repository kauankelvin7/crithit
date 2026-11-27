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

	<header class="mb-8 overflow-hidden rounded-sm border border-border-subtle bg-surface">
		<div class="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-7 sm:py-5" style="<?php echo esc_attr( sprintf( 'background-color:%s;color:%s;', $tg_style['fill'], $tg_style['ink'] ) ); ?>">
			<div>
				<span class="font-mono text-xs font-bold uppercase tracking-widest opacity-90">
					<?php esc_html_e( 'Editoria Oficial', 'teoriageek' ); ?>
				</span>
				<h1 class="mt-0.5 font-headline text-3xl font-extrabold uppercase tracking-[0.005em] sm:text-5xl">
					<?php echo esc_html( teoriageek_clean_title( single_cat_title( '', false ) ) ); ?>
				</h1>
			</div>
			<div class="flex flex-wrap items-center gap-2.5">
				<?php teoriageek_render_sponsor_badge( $tg_slug ); ?>
				<?php if ( $tg_term instanceof WP_Term ) : ?>
					<span class="rounded border-2 border-current/30 bg-black/15 px-3 py-1 font-mono text-xs font-bold uppercase">
						<?php echo esc_html( sprintf( _n( '%s matéria', '%s matérias', (int) $tg_term->count, 'teoriageek' ), number_format_i18n( (int) $tg_term->count ) ) ); ?>
					</span>
				<?php endif; ?>
			</div>
		</div>

		<?php
		$tg_cat_desc = category_description();
		if ( ! empty( $tg_cat_desc ) || ! empty( $tg_sub ) ) :
			?>
			<div class="space-y-3 border-t border-border-subtle bg-surface-alt px-4 py-4 sm:px-7">
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
		<?php
		$tg_cur_ordem = isset( $_GET['ordem'] ) ? sanitize_key( wp_unslash( $_GET['ordem'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$tg_base_url  = remove_query_arg( array( 'ordem', 'paged' ) );
		$tg_is_p1     = ( max( 1, (int) get_query_var( 'paged' ) ) === 1 );
		?>
		<div class="tg-archive-sort mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
			<span class="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted"><?php esc_html_e( 'Ordenar:', 'teoriageek' ); ?></span>
			<div class="flex flex-wrap items-center gap-1.5 font-mono text-xs font-bold">
				<a href="<?php echo esc_url( $tg_base_url ); ?>" class="rounded-sm border px-2.5 py-1 <?php echo '' === $tg_cur_ordem ? 'border-brand bg-brand-fill text-white' : 'border-border-subtle bg-surface-alt text-ink-secondary hover:text-ink-primary'; ?>"><?php esc_html_e( 'Recentes', 'teoriageek' ); ?></a>
				<a href="<?php echo esc_url( add_query_arg( 'ordem', 'populares', $tg_base_url ) ); ?>" class="rounded-sm border px-2.5 py-1 <?php echo 'populares' === $tg_cur_ordem ? 'border-brand bg-brand-fill text-white' : 'border-border-subtle bg-surface-alt text-ink-secondary hover:text-ink-primary'; ?>"><?php esc_html_e( 'Mais comentadas', 'teoriageek' ); ?></a>
				<a href="<?php echo esc_url( add_query_arg( 'ordem', 'criticas', $tg_base_url ) ); ?>" class="rounded-sm border px-2.5 py-1 <?php echo 'criticas' === $tg_cur_ordem ? 'border-brand bg-brand-fill text-white' : 'border-border-subtle bg-surface-alt text-ink-secondary hover:text-ink-primary'; ?>"><?php esc_html_e( 'Com nota', 'teoriageek' ); ?></a>
			</div>
		</div>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<?php
			$tg_loop_idx = 0;
			$tg_is_review_cat = in_array( $tg_slug, array( 'criticas', 'reviews', 'hands-on' ), true );
			while ( have_posts() ) :
				the_post();
				$tg_feat = ( $tg_is_p1 && 0 === $tg_loop_idx );
				$tg_loop_idx++;
				if ( $tg_feat ) { echo '<div class="tg-archive-featured">'; }
				get_template_part(
					'template-parts/card-article',
					null,
					array(
						'post'        => get_post(),
						'variant'     => $tg_is_review_cat ? 'review' : 'default',
						'heading_tag' => 'h2',
					)
				);
			if ( $tg_feat ) { echo '</div>'; }
			endwhile;
			?>
		</div>

		<?php teoriageek_pagination(); ?>
	<?php else : ?>
		<div class="rounded-sm border border-border-subtle bg-surface p-10 text-center">
			<p class="font-reading text-base text-ink-secondary">
				<?php esc_html_e( 'Nenhuma matéria publicada foi encontrada nesta editoria.', 'teoriageek' ); ?>
			</p>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="tactile-btn mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2 font-sans text-xs font-extrabold uppercase text-ink-highlight">
				<?php esc_html_e( 'Voltar para a capa', 'teoriageek' ); ?>
			</a>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
