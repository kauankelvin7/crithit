<?php
/**
 * Template Part: Gaveta de navegação mobile fluida e acessível.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_socials = teoriageek_get_social_links();
?>
<div id="tg-mobile-drawer" class="fixed inset-0 z-[70] hidden" aria-hidden="true">
	<div data-tg-drawer-close class="absolute inset-0 bg-black/70 backdrop-blur-xs"></div>

	<div role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Menu de navegação', 'teoriageek' ); ?>" data-chrome="dark" class="relative ml-auto flex h-full w-[86vw] max-w-sm flex-col border-l-2 border-highlight bg-chrome text-chrome-ink shadow-2xl">
		<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
			<?php
			$tg_drawer_logo = teoriageek_get_brand_logo_url( 'header' );
			$tg_drawer_name = (string) get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' );
			if ( '' !== $tg_drawer_logo ) :
				?>
				<img src="<?php echo esc_url( $tg_drawer_logo ); ?>" alt="<?php echo esc_attr( $tg_drawer_name ); ?>" width="300" height="190" loading="lazy" decoding="async" class="h-10 w-auto object-contain" />
			<?php else : ?>
				<span class="font-display text-xl tracking-wider text-highlight">
					<?php echo esc_html( strtoupper( $tg_drawer_name ) ); ?>
				</span>
			<?php endif; ?>
			<button type="button" data-tg-drawer-close aria-label="<?php esc_attr_e( 'Fechar menu', 'teoriageek' ); ?>" class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 bg-chrome-surface text-chrome-ink hover:border-highlight hover:text-highlight">
				<?php echo teoriageek_icon( 'x', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
		</div>

		<div class="flex-1 overflow-y-auto p-4 space-y-6">
			<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="relative">
				<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-chrome-muted">
					<?php echo teoriageek_icon( 'search', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</span>
				<input
					type="search"
					name="s"
					value="<?php echo esc_attr( get_search_query() ); ?>"
					aria-label="<?php esc_attr_e( 'Buscar no portal', 'teoriageek' ); ?>"
					placeholder="<?php esc_attr_e( 'Buscar matérias, críticas, jogos...', 'teoriageek' ); ?>"
					class="min-h-[42px] w-full rounded-sm border border-white/20 bg-chrome-surface py-2 pl-9 pr-3 font-sans text-base text-chrome-ink placeholder:text-chrome-muted focus:border-highlight focus:outline-none"
				/>
			</form>

			<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" class="flex min-h-[42px] items-center justify-between rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-wider text-ink-highlight">
				<span class="inline-flex items-center gap-2">
					<?php echo teoriageek_icon( 'film', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<?php esc_html_e( 'Explorar Teoria Geek Reels', 'teoriageek' ); ?>
				</span>
				<?php echo teoriageek_icon( 'arrow-right', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</a>

			<button type="button" data-tg-theme-toggle aria-pressed="false" class="flex min-h-[42px] w-full items-center justify-between rounded-sm border border-white/20 bg-chrome-surface px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-chrome-ink hover:border-highlight hover:text-highlight">
				<span class="inline-flex items-center gap-2">
					<span data-tg-theme-icon="moon" class="inline-flex"><?php echo teoriageek_icon( 'moon', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
					<span data-tg-theme-icon="sun" class="hidden"><?php echo teoriageek_icon( 'sun', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
					<span><?php esc_html_e( 'Aparência:', 'teoriageek' ); ?> <strong data-tg-theme-label><?php esc_html_e( 'Claro', 'teoriageek' ); ?></strong></span>
				</span>
				<span class="font-mono text-[11px] text-highlight"><?php esc_html_e( 'Alternar', 'teoriageek' ); ?></span>
			</button>

			<nav aria-label="<?php esc_attr_e( 'Menu Mobile', 'teoriageek' ); ?>" class="tg-mobile-nav">
				<?php teoriageek_render_primary_nav( 'tg-mobile-menu flex flex-col divide-y divide-white/10 font-sans text-sm font-semibold' ); ?>
			</nav>

			<?php if ( ! empty( $tg_socials ) ) : ?>
				<div class="border-t border-white/10 pt-4">
					<p class="mb-2.5 font-sans text-[11px] font-bold uppercase tracking-wider text-chrome-muted">
						<?php esc_html_e( 'Siga o Teoria Geek', 'teoriageek' ); ?>
					</p>
					<div class="flex flex-wrap items-center gap-2">
						<?php foreach ( $tg_socials as $tg_soc ) : ?>
							<a href="<?php echo esc_url( $tg_soc['url'] ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr( $tg_soc['label'] ); ?>" class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 bg-chrome-surface text-chrome-ink hover:border-highlight hover:text-highlight">
								<?php echo teoriageek_icon( $tg_soc['icon'], 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							</a>
						<?php endforeach; ?>
					</div>
				</div>
			<?php endif; ?>
		</div>
	</div>
</div>
