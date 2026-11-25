<?php
/**
 * Resultados de Busca (search.php).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

global $wp_query;
$tg_total = isset( $wp_query->found_posts ) ? (int) $wp_query->found_posts : 0;
$tg_term  = get_search_query();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php teoriageek_breadcrumb(); ?>

	<header class="mb-8 rounded-lg border-2 border-border-strong bg-surface p-5 shadow-hard sm:p-7">
		<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
			<div class="flex flex-wrap items-center gap-2.5">
				<span class="text-brand"><?php echo teoriageek_icon( 'search', 'h-6 w-6' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
				<h1 class="font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-4xl">
					<?php
					if ( '' !== $tg_term ) {
						echo esc_html( sprintf( __( 'Resultados para "%s"', 'teoriageek' ), $tg_term ) );
					} else {
						esc_html_e( 'Explorar Acervo', 'teoriageek' );
					}
					?>
				</h1>
				<span class="rounded border border-border-subtle bg-surface-alt px-2.5 py-0.5 font-mono text-xs font-bold text-ink-secondary">
					<?php echo esc_html( number_format_i18n( $tg_total ) ); ?>
				</span>
			</div>

			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-surface-alt px-3 py-1.5 font-mono text-xs font-bold uppercase text-ink-primary hover:bg-highlight hover:text-ink-highlight">
				<?php echo teoriageek_icon( 'x', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span><?php esc_html_e( 'Voltar à capa', 'teoriageek' ); ?></span>
			</a>
		</div>

		<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="mt-4 flex flex-col gap-2.5 sm:flex-row">
			<div class="relative flex-1">
				<span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
					<?php echo teoriageek_icon( 'search', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</span>
				<input
					type="search"
					name="s"
					value="<?php echo esc_attr( $tg_term ); ?>"
					aria-label="<?php esc_attr_e( 'Refinar termo de busca', 'teoriageek' ); ?>"
					placeholder="<?php esc_attr_e( 'Buscar por título, franquia, jogo, série ou crítica...', 'teoriageek' ); ?>"
					class="w-full rounded border-2 border-border-strong bg-surface py-2.5 pl-10 pr-4 font-sans text-sm text-ink-primary placeholder:text-ink-placeholder focus:border-brand focus:outline-none"
				/>
			</div>
			<button type="submit" class="tactile-btn rounded border-2 border-border-strong bg-highlight px-5 py-2.5 font-mono text-xs font-bold uppercase text-ink-highlight shadow-hard-sm">
				<?php esc_html_e( 'Pesquisar', 'teoriageek' ); ?>
			</button>
		</form>
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
			<h2 class="font-headline text-2xl font-extrabold uppercase text-ink-primary">
				<?php esc_html_e( 'Nenhuma matéria encontrada para este termo', 'teoriageek' ); ?>
			</h2>
			<p class="mx-auto mt-2 max-w-lg font-reading text-sm text-ink-secondary sm:text-base">
				<?php esc_html_e( 'Tente palavras-chave mais amplas ou navegue diretamente pelas principais editorias do Teoria Geek:', 'teoriageek' ); ?>
			</p>
			<div class="mt-5 flex flex-wrap items-center justify-center gap-2">
				<?php foreach ( array( 'noticias', 'games', 'filmes', 'series', 'animes-mangas', 'criticas', 'reviews' ) as $tg_s_slug ) : ?>
					<?php $tg_s_cat = get_category_by_slug( $tg_s_slug ); ?>
					<?php if ( $tg_s_cat ) : ?>
						<?php teoriageek_category_badge( $tg_s_cat, true, 'md' ); ?>
					<?php endif; ?>
				<?php endforeach; ?>
			</div>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
