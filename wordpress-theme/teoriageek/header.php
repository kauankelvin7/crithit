<?php
/**
 * Cabeçalho global do tema Teoria Geek.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_is_reels = teoriageek_is_reels_page();
$tg_socials  = teoriageek_get_social_links();
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'flex min-h-dvh flex-col bg-base font-sans text-ink-primary antialiased' ); ?>>
<?php wp_body_open(); ?>

<a href="#conteudo-principal" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded focus:border-2 focus:border-[#111111] focus:bg-highlight focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:text-ink-highlight">
	<?php esc_html_e( 'Pular para o conteúdo principal', 'teoriageek' ); ?>
</a>

<?php if ( is_singular( 'post' ) ) : ?>
	<div id="tg-reading-progress-wrap" aria-hidden="true" class="pointer-events-none fixed inset-x-0 top-0 z-[65] h-1 bg-transparent">
		<div id="tg-reading-progress" class="h-full w-full origin-left scale-x-0 bg-highlight"></div>
	</div>
<?php endif; ?>

<header data-chrome="dark" class="sticky top-0 z-50 w-full shrink-0 border-b-[3px] border-highlight bg-chrome text-chrome-ink">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
		<div class="flex min-w-0 items-center gap-3.5">
			<?php teoriageek_render_brand_logo(); ?>
			<span class="hidden xl:inline-block border-l border-white/15 pl-3.5 font-mono text-xs text-chrome-muted">
				<?php echo esc_html( get_bloginfo( 'description' ) ?: __( 'Portal de Cultura Pop & Games', 'teoriageek' ) ); ?>
			</span>
		</div>

		<div class="flex items-center gap-2 sm:gap-2.5">
			<?php if ( ! $tg_is_reels ) : ?>
				<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="relative hidden md:flex items-center">
					<span class="pointer-events-none absolute left-3 text-chrome-muted">
						<?php echo teoriageek_icon( 'search', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</span>
					<input
						type="search"
						name="s"
						value="<?php echo esc_attr( get_search_query() ); ?>"
						aria-label="<?php esc_attr_e( 'Buscar notícias no portal', 'teoriageek' ); ?>"
						placeholder="<?php esc_attr_e( 'Buscar matérias, jogos, críticas...', 'teoriageek' ); ?>"
						class="w-56 lg:w-64 rounded border-2 border-[var(--border-input)] bg-chrome-surface py-1.5 pl-9 pr-3 font-sans text-sm text-chrome-ink placeholder:text-chrome-muted focus:border-highlight focus:outline-none"
					/>
				</form>

				<button type="button" data-tg-search-open aria-label="<?php esc_attr_e( 'Abrir busca instantânea', 'teoriageek' ); ?>" class="inline-flex h-9 w-9 items-center justify-center rounded border-2 border-white/20 bg-chrome-surface text-chrome-ink transition-colors hover:border-highlight hover:text-highlight">
					<?php echo teoriageek_icon( 'search', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</button>
			<?php endif; ?>

			<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" <?php echo $tg_is_reels ? 'aria-current="page"' : ''; ?> class="inline-flex items-center gap-1.5 rounded border-2 border-highlight px-2.5 py-1.5 font-mono text-xs font-bold uppercase transition-colors <?php echo $tg_is_reels ? 'bg-highlight text-ink-highlight' : 'bg-chrome-surface text-highlight hover:bg-highlight hover:text-ink-highlight'; ?>">
				<?php echo teoriageek_icon( 'film', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span>Reels</span>
			</a>

			<button type="button" data-tg-theme-toggle aria-label="<?php esc_attr_e( 'Alternar entre modo claro e escuro', 'teoriageek' ); ?>" aria-pressed="false" class="inline-flex h-9 items-center gap-1.5 rounded border-2 border-white/20 bg-chrome-surface px-2.5 font-mono text-xs font-bold uppercase text-chrome-ink transition-colors hover:border-highlight hover:text-highlight">
				<span data-tg-theme-icon="moon" class="inline-flex"><?php echo teoriageek_icon( 'moon', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
				<span data-tg-theme-icon="sun" class="hidden"><?php echo teoriageek_icon( 'sun', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
				<span data-tg-theme-label class="hidden sm:inline"><?php esc_html_e( 'Tema', 'teoriageek' ); ?></span>
			</button>

			<?php if ( ! empty( $tg_socials ) && ! $tg_is_reels ) : ?>
				<div class="hidden xl:flex items-center gap-1 border-l border-white/15 pl-2.5">
					<?php foreach ( array_slice( $tg_socials, 0, 3 ) as $tg_soc ) : ?>
						<a href="<?php echo esc_url( $tg_soc['url'] ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr( $tg_soc['label'] ); ?>" class="inline-flex h-8 w-8 items-center justify-center rounded text-chrome-muted transition-colors hover:bg-chrome-surface hover:text-highlight">
							<?php echo teoriageek_icon( $tg_soc['icon'], 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</a>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>

			<button type="button" data-tg-drawer-open aria-label="<?php esc_attr_e( 'Abrir menu de editorias', 'teoriageek' ); ?>" aria-expanded="false" aria-controls="tg-mobile-drawer" class="inline-flex h-9 w-9 items-center justify-center rounded border-2 border-white/25 bg-chrome-surface text-chrome-ink hover:border-highlight hover:text-highlight lg:hidden">
				<?php echo teoriageek_icon( 'menu', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
		</div>
	</div>

	<?php if ( ! $tg_is_reels ) : ?>
		<div class="hidden border-t border-white/10 bg-chrome-surface lg:block">
			<nav aria-label="<?php esc_attr_e( 'Navegação principal de editorias', 'teoriageek' ); ?>" class="mx-auto max-w-7xl px-4 py-1.5">
				<?php teoriageek_render_primary_nav( 'tg-primary-menu flex flex-wrap items-center gap-x-1 gap-y-1 font-sans text-xs font-bold uppercase tracking-wide' ); ?>
			</nav>
		</div>
	<?php endif; ?>
</header>

<?php
if ( ! $tg_is_reels ) {
	$tg_top_ad = teoriageek_get_ad_slot_markup( 'top' );
	if ( '' !== $tg_top_ad ) {
		echo '<div class="mx-auto w-full max-w-7xl px-4">' . $tg_top_ad . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
?>
