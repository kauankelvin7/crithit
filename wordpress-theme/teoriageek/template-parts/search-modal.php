<?php
/**
 * Template Part: Modal de Busca Instantânea (REST API + formulário padrão WordPress).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="tg-search-modal" class="fixed inset-0 z-[80] hidden items-start justify-center p-4 pt-16 sm:pt-24" aria-hidden="true">
	<div data-tg-search-close class="fixed inset-0 bg-black/75 backdrop-blur-xs"></div>

	<div role="dialog" aria-modal="true" aria-labelledby="tg-search-modal-title" class="relative z-10 w-full max-w-2xl overflow-hidden rounded-sm border border-border-subtle bg-surface text-ink-primary shadow-2xl">
		<div class="flex items-center justify-between border-b border-border-subtle bg-surface-alt px-4 py-3">
			<h2 id="tg-search-modal-title" class="inline-flex items-center gap-2 font-headline text-lg font-extrabold uppercase tracking-wide text-ink-primary">
				<?php echo teoriageek_icon( 'search', 'h-4 w-4 text-brand' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<?php esc_html_e( 'Busca Instantânea no Acervo', 'teoriageek' ); ?>
			</h2>
			<button type="button" data-tg-search-close aria-label="<?php esc_attr_e( 'Fechar busca', 'teoriageek' ); ?>" class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border-subtle bg-surface text-ink-secondary hover:border-border-strong hover:text-ink-primary">
				<?php echo teoriageek_icon( 'x', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
		</div>

		<form role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>" class="p-4">
			<div class="relative flex items-center gap-2">
				<div class="relative flex-1">
					<span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted">
						<?php echo teoriageek_icon( 'search', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</span>
					<input
						id="tg-instant-search-input"
						type="search"
						name="s"
						value="<?php echo esc_attr( get_search_query() ); ?>"
						autocomplete="off"
						aria-label="<?php esc_attr_e( 'Digite sua busca', 'teoriageek' ); ?>"
						placeholder="<?php esc_attr_e( 'Ex.: Marvel, Nintendo Switch 2, Anéis de Poder, CCXP...', 'teoriageek' ); ?>"
						class="min-h-[42px] w-full rounded-sm border border-border-subtle bg-surface-alt py-2.5 pl-10 pr-4 font-sans text-base text-ink-primary placeholder:text-ink-placeholder focus:border-brand focus:outline-none"
					/>
				</div>
				<button type="submit" class="tactile-btn min-h-[42px] shrink-0 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2.5 font-sans text-xs font-extrabold uppercase text-ink-highlight">
					<?php esc_html_e( 'Buscar', 'teoriageek' ); ?>
				</button>
			</div>
		</form>

		<div id="tg-instant-search-results" aria-live="polite" class="max-h-[60vh] overflow-y-auto border-t border-border-subtle px-4 py-3">
			<p class="py-3 text-center font-mono text-xs text-ink-muted">
				<?php esc_html_e( 'Digite ao menos 2 letras para visualizar resultados instantâneos ou pressione Enter.', 'teoriageek' ); ?>
			</p>
		</div>
	</div>
</div>
