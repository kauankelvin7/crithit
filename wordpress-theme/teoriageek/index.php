<?php
/**
 * Template Principal de Fallback (index.php).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<header class="mb-8 border-b-[3px] border-border-strong pb-3">
		<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
			<?php esc_html_e( 'Publicações Recentes', 'teoriageek' ); ?>
		</p>
		<h1 class="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-5xl">
			<?php echo esc_html( get_bloginfo( 'name' ) ?: 'Teoria Geek' ); ?>
		</h1>
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
		<p class="font-reading text-base text-ink-secondary"><?php esc_html_e( 'Nenhuma publicação encontrada.', 'teoriageek' ); ?></p>
	<?php endif; ?>
</main>

<?php
get_footer();
