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

	<header class="mb-8 rounded-lg border-2 border-border-strong bg-surface p-6 shadow-hard">
		<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
			<?php esc_html_e( 'Arquivo Editorial', 'teoriageek' ); ?>
		</p>
		<h1 class="mt-1 font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-5xl">
			<?php echo wp_kses_post( get_the_archive_title() ); ?>
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
		<div class="rounded-lg border-2 border-border-strong bg-surface p-10 text-center shadow-hard-sm">
			<p class="font-reading text-base text-ink-secondary"><?php esc_html_e( 'Nenhuma matéria encontrada neste período.', 'teoriageek' ); ?></p>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
