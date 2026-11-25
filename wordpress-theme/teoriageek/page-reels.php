<?php
/**
 * Template Name: Teoria Geek Reels
 * Experiência imersiva de Micro-Stories verticais em 3 zonas do portal Teoria Geek.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$tg_focus_slug = isset( $_GET['post'] ) ? sanitize_title( wp_unslash( $_GET['post'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$tg_cat_slug   = isset( $_GET['category'] ) ? sanitize_title( wp_unslash( $_GET['category'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

$tg_initial_args = array(
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => 10,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
);
if ( '' !== $tg_cat_slug ) {
	$tg_initial_args['category_name'] = $tg_cat_slug;
}
$tg_initial_q     = new WP_Query( $tg_initial_args );
$tg_initial_posts = $tg_initial_q->posts;

if ( '' !== $tg_focus_slug ) {
	$tg_target = get_page_by_path( $tg_focus_slug, OBJECT, 'post' );
	if ( $tg_target instanceof WP_Post && 'publish' === $tg_target->post_status ) {
		$tg_initial_posts = array_filter(
			$tg_initial_posts,
			static function ( $p ) use ( $tg_target ) {
				return (int) $p->ID !== (int) $tg_target->ID;
			}
		);
		array_unshift( $tg_initial_posts, $tg_target );
	}
}

$tg_serialized = array_map( 'teoriageek_serialize_post_card', array_slice( $tg_initial_posts, 0, 10 ) );

$tg_reel_cats = array();
foreach ( array( 'noticias', 'games', 'filmes', 'series', 'animes-mangas', 'criticas', 'reviews' ) as $tg_rc_slug ) {
	$tg_rc_term = get_category_by_slug( $tg_rc_slug );
	if ( $tg_rc_term && ! is_wp_error( $tg_rc_term ) ) {
		$tg_reel_cats[] = $tg_rc_term;
	}
}
?>

<main id="conteudo-principal" data-chrome="dark" class="relative flex h-[calc(100dvh-4rem)] w-full overflow-hidden bg-[#090A0F] text-white">
	<script id="tg-reels-initial-data" type="application/json"><?php echo wp_json_encode( $tg_serialized, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ); ?></script>

	<!-- ZONA 1 (Desktop Left Sidebar): Navegação & Editorias -->
	<aside aria-label="<?php esc_attr_e( 'Filtros de Reels', 'teoriageek' ); ?>" class="hidden w-64 shrink-0 flex-col justify-between border-r border-white/10 bg-chrome p-4 lg:flex">
		<div class="space-y-5">
			<div>
				<p class="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-chrome-muted">
					<?php esc_html_e( 'Explorar Feed', 'teoriageek' ); ?>
				</p>
				<div class="space-y-1">
					<button type="button" data-tg-reel-tab="foryou" aria-pressed="true" class="flex w-full items-center gap-2.5 rounded px-3 py-2 font-sans text-sm font-bold bg-highlight text-ink-highlight">
						<?php echo teoriageek_icon( 'compass', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<span><?php esc_html_e( 'Para Você', 'teoriageek' ); ?></span>
					</button>
					<button type="button" data-tg-reel-tab="trending" aria-pressed="false" class="flex w-full items-center gap-2.5 rounded px-3 py-2 font-sans text-sm font-semibold text-chrome-ink hover:bg-chrome-surface">
						<?php echo teoriageek_icon( 'flame', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<span><?php esc_html_e( 'Mais Lidas', 'teoriageek' ); ?></span>
					</button>
				</div>
			</div>

			<div>
				<p class="mb-2 font-mono text-[11px] font-bold uppercase tracking-widest text-chrome-muted">
					<?php esc_html_e( 'Editorias', 'teoriageek' ); ?>
				</p>
				<div class="space-y-1">
					<button type="button" data-tg-reel-cat="" class="flex w-full items-center justify-between rounded px-3 py-1.5 font-mono text-xs font-bold text-highlight bg-chrome-surface">
						<span><?php esc_html_e( 'Todas', 'teoriageek' ); ?></span>
					</button>
					<?php foreach ( $tg_reel_cats as $tg_rc ) : ?>
						<button type="button" data-tg-reel-cat="<?php echo esc_attr( $tg_rc->slug ); ?>" class="flex w-full items-center justify-between rounded px-3 py-1.5 font-mono text-xs text-chrome-muted hover:bg-chrome-surface hover:text-white">
							<span class="truncate"><?php echo esc_html( html_entity_decode( $tg_rc->name, ENT_QUOTES, 'UTF-8' ) ); ?></span>
							<span class="text-[11px] opacity-70"><?php echo esc_html( teoriageek_format_compact( (int) $tg_rc->count ) ); ?></span>
						</button>
					<?php endforeach; ?>
				</div>
			</div>
		</div>

		<div class="rounded border border-white/10 bg-chrome-surface p-3 font-mono text-[11px] text-chrome-muted space-y-1">
			<p class="font-bold uppercase text-white"><?php esc_html_e( 'Atalhos de Teclado', 'teoriageek' ); ?></p>
			<p>↑ / ↓ — <?php esc_html_e( 'Próximo / Anterior', 'teoriageek' ); ?></p>
			<p>← / → — <?php esc_html_e( 'Trocar Lâmina (1–3)', 'teoriageek' ); ?></p>
		</div>
	</aside>

	<!-- ZONA 2 (Palco Central Vertical) -->
	<section aria-label="<?php esc_attr_e( 'Palco de Reels', 'teoriageek' ); ?>" class="relative flex flex-1 items-center justify-center overflow-hidden">
		<div id="tg-reels-stage" class="reels-scroller h-full w-full snap-y snap-mandatory overflow-y-auto sm:py-4"></div>

		<div class="hidden flex-col gap-2 pl-4 sm:flex">
			<button type="button" data-tg-reel-prev aria-label="<?php esc_attr_e( 'Reel anterior', 'teoriageek' ); ?>" class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-chrome-surface text-white hover:border-highlight hover:text-highlight">
				<?php echo teoriageek_icon( 'chevron-up', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
			<button type="button" data-tg-reel-next aria-label="<?php esc_attr_e( 'Próximo Reel', 'teoriageek' ); ?>" class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-chrome-surface text-white hover:border-highlight hover:text-highlight">
				<?php echo teoriageek_icon( 'chevron-down', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
		</div>
	</section>

	<!-- ZONA 3 (Desktop XL Painel de Contexto & Resumo) -->
	<aside aria-label="<?php esc_attr_e( 'Resumo e leitura completa', 'teoriageek' ); ?>" class="hidden w-80 shrink-0 flex-col justify-between border-l border-white/10 bg-chrome p-5 xl:flex">
		<div id="tg-reels-context" class="space-y-4"></div>
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="inline-flex items-center justify-center gap-2 rounded border-2 border-white/20 bg-chrome-surface px-4 py-2.5 font-mono text-xs font-bold uppercase text-chrome-ink hover:border-highlight hover:text-highlight">
			<?php echo teoriageek_icon( 'newspaper', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<span><?php esc_html_e( 'Voltar para a Capa', 'teoriageek' ); ?></span>
		</a>
	</aside>
</main>

<?php
get_footer();
