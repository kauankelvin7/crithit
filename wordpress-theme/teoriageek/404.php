<?php
/**
 * Página 404 — Pauta Não Encontrada (404.php).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$tg_latest_404 = new WP_Query(
	array(
		'post_type'           => 'post',
		'post_status'         => 'publish',
		'posts_per_page'      => 3,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	)
);
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-10 sm:py-14">
	<section class="mx-auto max-w-3xl rounded-sm border border-border-subtle border-t-4 border-t-brand bg-surface p-6 text-center sm:p-10">
		<span class="inline-block rounded-sm border border-[#0B0F19] bg-highlight px-4 py-1 font-display text-4xl tracking-wider text-ink-highlight sm:text-5xl">
			404
		</span>

		<h1 class="mt-5 font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-5xl">
			<?php esc_html_e( 'Pauta Não Encontrada neste Universo', 'teoriageek' ); ?>
		</h1>

		<p class="mx-auto mt-3 max-w-xl font-reading text-base leading-relaxed text-ink-secondary">
			<?php esc_html_e( 'O link que você acessou pode ter mudado de endereço ou não existe mais. Use a busca abaixo ou volte para a capa editorial.', 'teoriageek' ); ?>
		</p>

		<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="mx-auto mt-6 flex max-w-lg flex-col gap-2.5 sm:flex-row">
			<input
				type="search"
				name="s"
				aria-label="<?php esc_attr_e( 'Buscar matérias no portal', 'teoriageek' ); ?>"
				placeholder="<?php esc_attr_e( 'Buscar no acervo do Teoria Geek...', 'teoriageek' ); ?>"
				class="min-h-[42px] flex-1 rounded-sm border border-border-subtle bg-surface-alt px-4 py-2.5 font-sans text-base text-ink-primary placeholder:text-ink-placeholder focus:border-brand focus:outline-none"
			/>
			<button type="submit" class="tactile-btn min-h-[42px] rounded-sm bg-brand-fill px-5 py-2.5 font-sans text-xs font-extrabold uppercase text-white">
				<?php esc_html_e( 'Buscar', 'teoriageek' ); ?>
			</button>
		</form>

		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2 font-sans text-xs font-extrabold uppercase text-ink-highlight">
				<?php esc_html_e( 'Ir para a Capa', 'teoriageek' ); ?>
			</a>
			<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" class="tactile-btn inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-alt px-4 py-2 font-sans text-xs font-bold uppercase text-ink-primary">
				<?php echo teoriageek_icon( 'film', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span><?php esc_html_e( 'Explorar Reels', 'teoriageek' ); ?></span>
			</a>
		</div>
	</section>

	<?php if ( ! empty( $tg_latest_404->posts ) ) : ?>
		<section aria-labelledby="tg-404-latest" class="mt-12">
			<h2 id="tg-404-latest" class="mb-5 border-b-[3px] border-border-strong pb-2 font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-3xl">
				<?php esc_html_e( 'Últimas Matérias na Capa', 'teoriageek' ); ?>
			</h2>
			<div class="grid gap-6 sm:grid-cols-3">
				<?php foreach ( $tg_latest_404->posts as $tg_p404 ) : ?>
					<?php get_template_part( 'template-parts/card-article', null, array( 'post' => $tg_p404 ) ); ?>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>
</main>

<?php
get_footer();
