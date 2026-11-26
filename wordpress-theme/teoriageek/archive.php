<?php
/**
 * Arquivo Genérico (archive.php — Datas, Formatos e Taxonomias).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php teoriageek_breadcrumb(); ?>

	<header class="mb-8 rounded-sm border border-border-subtle border-t-4 border-t-brand bg-surface p-4 sm:p-6">
		<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
			<?php esc_html_e( 'Arquivo Editorial', 'teoriageek' ); ?>
		</p>
		<h1 class="mt-1 font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-5xl">
			<?php echo wp_kses_post( teoriageek_fix_mojibake( get_the_archive_title() ) ); ?>
		</h1>
		<?php
		$tg_arch_desc = get_the_archive_description();
		if ( ! empty( $tg_arch_desc ) ) :
			?>
			<div class="mt-3 max-w-3xl font-reading text-sm text-ink-secondary">
				<?php echo wp_kses_post( $tg_arch_desc ); ?>
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
		<div class="rounded-sm border border-border-subtle bg-surface p-10 text-center">
			<p class="font-reading text-base text-ink-secondary"><?php esc_html_e( 'Nenhuma matéria encontrada neste período.', 'teoriageek' ); ?></p>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="tactile-btn mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2 font-sans text-xs font-extrabold uppercase text-ink-highlight">
				<?php esc_html_e( 'Voltar para a capa', 'teoriageek' ); ?>
			</a>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
