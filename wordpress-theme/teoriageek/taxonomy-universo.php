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

	<header data-chrome="dark" class="mb-8 overflow-hidden rounded-sm border border-white/15 border-t-4 border-t-highlight bg-chrome p-4 text-chrome-ink sm:p-8">
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
				<?php esc_html_e( 'Nenhuma matéria publicada neste universo ainda.', 'teoriageek' ); ?>
			</p>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="tactile-btn mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2 font-sans text-xs font-extrabold uppercase text-ink-highlight">
				<?php esc_html_e( 'Voltar para a capa', 'teoriageek' ); ?>
			</a>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
