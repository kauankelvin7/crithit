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

	<header class="mb-8 rounded-sm border border-border-subtle border-t-4 border-t-brand bg-surface p-4 sm:p-7">
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
				<span class="rounded-sm border border-border-subtle bg-surface-alt px-2.5 py-0.5 font-mono text-xs font-bold text-ink-secondary">
					<?php echo esc_html( number_format_i18n( $tg_total ) ); ?>
				</span>
			</div>

			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-alt px-3 py-1.5 font-sans text-xs font-bold uppercase text-ink-primary hover:bg-highlight hover:text-ink-highlight">
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
					class="min-h-[42px] w-full rounded-sm border border-border-subtle bg-surface-alt py-2.5 pl-10 pr-4 font-sans text-base text-ink-primary placeholder:text-ink-placeholder focus:border-brand focus:outline-none"
				/>
			</div>
			<?php
			$tg_sel_cat   = isset( $_GET['tg_cat'] ) ? absint( $_GET['tg_cat'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$tg_sel_ordem = isset( $_GET['ordem'] ) ? sanitize_key( wp_unslash( $_GET['ordem'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$tg_all_cats  = get_categories( array( 'hide_empty' => true, 'parent' => 0, 'number' => 14 ) );
			?>
			<select name="tg_cat" aria-label="<?php esc_attr_e( 'Filtrar por editoria', 'teoriageek' ); ?>" class="min-h-[42px] rounded-sm border border-border-subtle bg-surface-alt px-3 py-2 font-sans text-xs font-semibold text-ink-primary focus:border-brand focus:outline-none">
				<option value="0"><?php esc_html_e( 'Todas as editorias', 'teoriageek' ); ?></option>
				<?php foreach ( $tg_all_cats as $tg_c_opt ) : ?>
					<option value="<?php echo esc_attr( (string) $tg_c_opt->term_id ); ?>" <?php selected( $tg_sel_cat, (int) $tg_c_opt->term_id ); ?>>
						<?php echo esc_html( html_entity_decode( $tg_c_opt->name, ENT_QUOTES, 'UTF-8' ) ); ?>
					</option>
				<?php endforeach; ?>
			</select>
			<select name="ordem" aria-label="<?php esc_attr_e( 'Ordenar resultados', 'teoriageek' ); ?>" class="min-h-[42px] rounded-sm border border-border-subtle bg-surface-alt px-3 py-2 font-sans text-xs font-semibold text-ink-primary focus:border-brand focus:outline-none">
				<option value="" <?php selected( $tg_sel_ordem, '' ); ?>><?php esc_html_e( 'Mais relevantes', 'teoriageek' ); ?></option>
				<option value="recentes" <?php selected( $tg_sel_ordem, 'recentes' ); ?>><?php esc_html_e( 'Mais recentes', 'teoriageek' ); ?></option>
			</select>
			<button type="submit" class="tactile-btn min-h-[42px] rounded-sm border border-[#0B0F19] bg-highlight px-5 py-2.5 font-sans text-xs font-extrabold uppercase text-ink-highlight">
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
		<div class="rounded-sm border border-border-subtle bg-surface p-10 text-center">
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
