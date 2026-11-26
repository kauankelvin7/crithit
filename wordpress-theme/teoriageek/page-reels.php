<?php
/**
 * Template Name: Teoria Geek Reels
 * Experiência imersiva de Micro-Stories verticais 9:16 em 3 zonas (Desktop) e tela cheia nativa (Mobile).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$tg_focus_slug = isset( $_GET['post'] ) ? sanitize_title( wp_unslash( $_GET['post'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$tg_focus_id   = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
$tg_cat_slug   = isset( $_GET['category'] ) ? sanitize_title( wp_unslash( $_GET['category'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

$tg_initial_args = array(
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => 10,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => true,
);
if ( '' !== $tg_cat_slug ) {
	$tg_cat_obj = get_category_by_slug( $tg_cat_slug );
	if ( $tg_cat_obj && ! is_wp_error( $tg_cat_obj ) ) {
		$tg_initial_args['cat'] = (int) $tg_cat_obj->term_id;
	} else {
		$tg_initial_args['category_name'] = $tg_cat_slug;
	}
}
$tg_initial_q = new WP_Query( $tg_initial_args );
update_post_thumbnail_cache( $tg_initial_q );
$tg_initial_posts = $tg_initial_q->posts;

if ( '' !== $tg_focus_slug || $tg_focus_id > 0 ) {
	$tg_target = ( $tg_focus_id > 0 ) ? get_post( $tg_focus_id ) : get_page_by_path( $tg_focus_slug, OBJECT, 'post' );
	if ( $tg_target instanceof WP_Post && 'post' === $tg_target->post_type && 'publish' === $tg_target->post_status ) {
		$tg_initial_posts = array_filter(
			$tg_initial_posts,
			static function ( $p ) use ( $tg_target ) {
				return (int) $p->ID !== (int) $tg_target->ID;
			}
		);
		array_unshift( $tg_initial_posts, $tg_target );
	}
}

$tg_serialized = teoriageek_serialize_reels_batch( array_slice( $tg_initial_posts, 0, 10 ) );
$tg_reel_cats  = teoriageek_get_reels_categories();
?>

<main id="conteudo-principal" data-chrome="dark" class="tg-reels-shell relative flex w-full flex-col overflow-hidden bg-[#090A0F] text-white lg:flex-row">
	<script id="tg-reels-initial-data" type="application/json"><?php echo wp_json_encode( $tg_serialized, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ); ?></script>

	<!-- Barra Mobile/Tablet (< 1024px): abas + chips horizontais roláveis sem overflow -->
	<div aria-label="<?php esc_attr_e( 'Filtros rápidos de Reels', 'teoriageek' ); ?>" class="tg-reels-mobile-bar flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/10 bg-chrome px-3 py-2 lg:hidden">
		<button type="button" data-tg-reel-tab="foryou" aria-pressed="true" class="tg-reel-chip shrink-0 rounded-sm border border-[#0B0F19] bg-highlight px-3 py-1.5 font-sans text-[11px] font-extrabold uppercase text-ink-highlight">
			<?php esc_html_e( 'Para Você', 'teoriageek' ); ?>
		</button>
		<button type="button" data-tg-reel-tab="trending" aria-pressed="false" class="tg-reel-chip shrink-0 rounded-sm border border-white/15 bg-chrome-surface px-3 py-1.5 font-sans text-[11px] font-bold uppercase text-chrome-ink">
			<?php esc_html_e( 'Mais Lidas', 'teoriageek' ); ?>
		</button>
		<button type="button" data-tg-reel-tab="saved" aria-pressed="false" class="tg-reel-chip shrink-0 rounded-sm border border-white/15 bg-chrome-surface px-3 py-1.5 font-sans text-[11px] font-bold uppercase text-chrome-ink">
			<?php esc_html_e( 'Salvos', 'teoriageek' ); ?>
		</button>
		<span aria-hidden="true" class="mx-1 h-4 w-px shrink-0 bg-white/15"></span>
		<button type="button" data-tg-reel-cat="" aria-pressed="<?php echo '' === $tg_cat_slug ? 'true' : 'false'; ?>" class="tg-reel-cat-chip shrink-0 rounded-sm border px-3 py-1.5 font-sans text-[11px] font-bold uppercase <?php echo '' === $tg_cat_slug ? 'border-highlight bg-brand-fill text-white' : 'border-white/15 bg-chrome-surface text-chrome-muted'; ?>">
			<?php esc_html_e( 'Todas', 'teoriageek' ); ?>
		</button>
		<?php foreach ( $tg_reel_cats as $tg_rc ) : ?>
			<?php $tg_is_curr = ( $tg_cat_slug === $tg_rc['slug'] ); ?>
			<button type="button" data-tg-reel-cat="<?php echo esc_attr( $tg_rc['slug'] ); ?>" aria-pressed="<?php echo $tg_is_curr ? 'true' : 'false'; ?>" class="tg-reel-cat-chip shrink-0 rounded-sm border px-3 py-1.5 font-sans text-[11px] font-bold uppercase <?php echo $tg_is_curr ? 'border-highlight bg-brand-fill text-white' : 'border-white/15 bg-chrome-surface text-chrome-muted'; ?>">
				<?php echo esc_html( $tg_rc['name'] ); ?>
			</button>
		<?php endforeach; ?>
	</div>

	<!-- ZONA 1 (Desktop Left Sidebar): Navegação & Editorias -->
	<aside aria-label="<?php esc_attr_e( 'Filtros de Reels', 'teoriageek' ); ?>" class="tg-reels-aside-scroll hidden w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/10 bg-chrome p-4 lg:flex">
		<div class="space-y-5">
			<div>
				<p class="mb-2 font-sans text-[11px] font-bold uppercase tracking-widest text-slate-300">
					<?php esc_html_e( 'Explorar Feed', 'teoriageek' ); ?>
				</p>
				<div class="space-y-1">
					<button type="button" data-tg-reel-tab="foryou" aria-pressed="true" class="flex min-h-[40px] w-full items-center gap-2.5 rounded-sm bg-highlight px-3 py-2 font-sans text-sm font-extrabold text-ink-highlight">
						<?php echo teoriageek_icon( 'compass', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<span><?php esc_html_e( 'Para Você', 'teoriageek' ); ?></span>
					</button>
					<button type="button" data-tg-reel-tab="trending" aria-pressed="false" class="flex min-h-[40px] w-full items-center gap-2.5 rounded-sm px-3 py-2 font-sans text-sm font-semibold text-slate-200 hover:bg-chrome-surface hover:text-white">
						<?php echo teoriageek_icon( 'flame', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<span><?php esc_html_e( 'Mais Lidas', 'teoriageek' ); ?></span>
					</button>
					<button type="button" data-tg-reel-tab="saved" aria-pressed="false" class="flex min-h-[40px] w-full items-center gap-2.5 rounded-sm px-3 py-2 font-sans text-sm font-semibold text-slate-200 hover:bg-chrome-surface hover:text-white">
						<?php echo teoriageek_icon( 'bookmark', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<span><?php esc_html_e( 'Salvos', 'teoriageek' ); ?></span>
					</button>
				</div>
			</div>

			<div>
				<p class="mb-2 font-sans text-[11px] font-bold uppercase tracking-widest text-slate-300">
					<?php esc_html_e( 'Editorias', 'teoriageek' ); ?>
				</p>
				<div class="space-y-1">
					<button type="button" data-tg-reel-cat="" aria-pressed="<?php echo '' === $tg_cat_slug ? 'true' : 'false'; ?>" class="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-sm border-l-[3px] px-3 py-1.5 font-sans text-xs <?php echo '' === $tg_cat_slug ? 'border-highlight bg-white/10 font-bold text-white' : 'border-transparent font-medium text-slate-300 hover:bg-chrome-surface hover:text-white'; ?>">
						<span><?php esc_html_e( 'Todas', 'teoriageek' ); ?></span>
					</button>
					<?php foreach ( $tg_reel_cats as $tg_rc ) : ?>
						<?php $tg_is_curr = ( $tg_cat_slug === $tg_rc['slug'] ); ?>
						<button type="button" data-tg-reel-cat="<?php echo esc_attr( $tg_rc['slug'] ); ?>" aria-pressed="<?php echo $tg_is_curr ? 'true' : 'false'; ?>" class="flex min-h-[36px] w-full items-center justify-between gap-2 rounded-sm border-l-[3px] px-3 py-1.5 font-sans text-xs <?php echo $tg_is_curr ? 'border-highlight bg-white/10 font-bold text-white' : 'border-transparent font-medium text-slate-300 hover:bg-chrome-surface hover:text-white'; ?>">
							<span class="truncate text-left"><?php echo esc_html( $tg_rc['name'] ); ?></span>
							<span class="shrink-0 font-mono text-[11px] <?php echo $tg_is_curr ? 'text-highlight' : 'text-slate-400'; ?>"><?php echo esc_html( teoriageek_format_compact( (int) $tg_rc['count'] ) ); ?></span>
						</button>
					<?php endforeach; ?>
				</div>
			</div>
		</div>

		<div class="mt-4 space-y-1 rounded-sm border border-white/15 bg-chrome-surface p-3 font-sans text-xs text-slate-300">
			<p class="font-bold uppercase tracking-wider text-white"><?php esc_html_e( 'Atalhos', 'teoriageek' ); ?></p>
			<p><kbd class="font-mono font-bold text-highlight">↑ / ↓</kbd> <?php esc_html_e( 'Trocar Reel', 'teoriageek' ); ?></p>
			<p><kbd class="font-mono font-bold text-highlight">← / →</kbd> <?php esc_html_e( 'Lâminas (1–3)', 'teoriageek' ); ?></p>
			<p><kbd class="font-mono font-bold text-highlight">S</kbd> <?php esc_html_e( 'Salvar matéria', 'teoriageek' ); ?></p>
		</div>
	</aside>

	<!-- ZONA 2 (Palco Central com controles ancorados diretamente ao lado do player) -->
	<section aria-label="<?php esc_attr_e( 'Palco de Reels', 'teoriageek' ); ?>" class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
		<div class="tg-reels-stage-wrap relative flex h-full w-full items-center justify-center sm:gap-4 sm:px-4">
			<div id="tg-reels-stage" class="tg-reels-stage reels-scroller relative h-full w-full snap-y snap-mandatory overflow-y-auto"></div>

			<!-- Controles Anterior/Próximo ancorados ao lado do player (Desktop/Tablet) -->
			<div class="hidden shrink-0 flex-col items-center gap-3 sm:flex">
				<button type="button" data-tg-reel-prev aria-label="<?php esc_attr_e( 'Reel anterior', 'teoriageek' ); ?>" class="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-white/25 bg-chrome-surface text-white transition-colors hover:border-highlight hover:text-highlight disabled:opacity-35">
					<?php echo teoriageek_icon( 'chevron-up', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</button>
				<span id="tg-reels-counter-rail" class="font-mono text-xs font-bold text-slate-200">1 / 10</span>
				<button type="button" data-tg-reel-next aria-label="<?php esc_attr_e( 'Próximo Reel', 'teoriageek' ); ?>" class="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-white/25 bg-chrome-surface text-white transition-colors hover:border-highlight hover:text-highlight disabled:opacity-35">
					<?php echo teoriageek_icon( 'chevron-down', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</button>
			</div>
		</div>
	</section>

	<!-- ZONA 3 (Desktop XL Painel Complementar — zero duplicação do título/resumo do player) -->
	<aside aria-label="<?php esc_attr_e( 'Contexto complementar e fila', 'teoriageek' ); ?>" class="tg-reels-aside-scroll hidden w-[356px] shrink-0 flex-col justify-between overflow-y-auto border-l border-white/10 bg-chrome p-5 xl:flex">
		<div id="tg-reels-context" class="space-y-4"></div>
		<div class="mt-4 border-t border-white/10 pt-4">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-sm border border-white/20 bg-chrome-surface px-4 py-2 font-sans text-xs font-bold uppercase text-slate-100 transition-colors hover:border-highlight hover:text-highlight">
				<?php echo teoriageek_icon( 'newspaper', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span><?php esc_html_e( 'Voltar para a Capa', 'teoriageek' ); ?></span>
			</a>
		</div>
	</aside>
</main>

<?php
get_footer();
