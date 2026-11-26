<?php
/**
 * Template Part: Bloco configurável de convite para Canal WhatsApp / Telegram (Customizer).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_wa = teoriageek_safe_http_url( (string) get_theme_mod( 'teoriageek_channel_whatsapp', '' ) );
$tg_tg = teoriageek_safe_http_url( (string) get_theme_mod( 'teoriageek_channel_telegram', '' ) );

if ( '' === $tg_wa && '' === $tg_tg ) {
	return;
}

$tg_title = (string) get_theme_mod( 'teoriageek_channel_title', __( 'Entre na Comunidade Teoria Geek', 'teoriageek' ) );
$tg_sub   = (string) get_theme_mod( 'teoriageek_channel_subtitle', __( 'Receba notícias de games, cinema, séries e críticas direto no celular, sem spam.', 'teoriageek' ) );
?>
<section aria-label="<?php esc_attr_e( 'Canais oficiais no WhatsApp e Telegram', 'teoriageek' ); ?>" data-chrome="dark" class="mt-10 rounded-sm border border-white/15 bg-chrome p-5 text-chrome-ink sm:p-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="space-y-1.5">
			<span class="inline-block rounded-sm bg-highlight px-2 py-0.5 font-sans text-[11px] font-extrabold uppercase tracking-wider text-ink-highlight">
				<?php esc_html_e( 'Canais Oficiais', 'teoriageek' ); ?>
			</span>
			<h2 class="font-headline text-2xl font-extrabold uppercase tracking-[0.005em] text-white sm:text-3xl">
				<?php echo esc_html( $tg_title ); ?>
			</h2>
			<p class="max-w-xl font-reading text-sm text-chrome-muted">
				<?php echo esc_html( $tg_sub ); ?>
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<?php if ( '' !== $tg_wa ) : ?>
				<a href="<?php echo esc_url( $tg_wa ); ?>" target="_blank" rel="noopener noreferrer" class="tactile-btn inline-flex min-h-[40px] items-center gap-2 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2.5 font-sans text-xs font-extrabold uppercase text-ink-highlight">
					<?php echo teoriageek_icon( 'whatsapp', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<span><?php esc_html_e( 'Canal no WhatsApp', 'teoriageek' ); ?></span>
				</a>
			<?php endif; ?>
			<?php if ( '' !== $tg_tg ) : ?>
				<a href="<?php echo esc_url( $tg_tg ); ?>" target="_blank" rel="noopener noreferrer" class="tactile-btn inline-flex min-h-[40px] items-center gap-2 rounded-sm border border-white/25 bg-chrome-surface px-4 py-2.5 font-sans text-xs font-bold uppercase text-white hover:border-highlight hover:text-highlight">
					<?php echo teoriageek_icon( 'send', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<span><?php esc_html_e( 'Canal no Telegram', 'teoriageek' ); ?></span>
				</a>
			<?php endif; ?>
		</div>
	</div>
</section>
