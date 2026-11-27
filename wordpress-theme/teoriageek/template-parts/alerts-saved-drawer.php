<?php
/**
 * Template Part: Central de Alertas & Últimas da Redação (integração opcional OneSignal/WebPushr).
 * Lê os canais oficiais configurados no Personalizador (WhatsApp, Telegram e Google Notícias)
 * e estiliza 100% com classes CSS dedicadas (.tg-alerts-*) em design-system.css.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_wa_link = teoriageek_safe_http_url( (string) get_theme_mod( 'teoriageek_channel_whatsapp', '' ) );
$tg_tg_link = teoriageek_safe_http_url( (string) get_theme_mod( 'teoriageek_channel_telegram', '' ) );
$tg_gn_link = teoriageek_safe_http_url( (string) get_theme_mod( 'teoriageek_channel_google_news', '' ) );

// Fallback de compatibilidade caso os links tenham sido cadastrados em redes sociais.
if ( '' === $tg_wa_link || '' === $tg_tg_link ) {
	$tg_socials = teoriageek_get_social_links();
	foreach ( $tg_socials as $tg_s ) {
		if ( isset( $tg_s['icon'] ) && 'whatsapp' === $tg_s['icon'] && '' === $tg_wa_link ) {
			$tg_wa_link = $tg_s['url'];
		}
		if ( isset( $tg_s['icon'] ) && 'telegram' === $tg_s['icon'] && '' === $tg_tg_link ) {
			$tg_tg_link = $tg_s['url'];
		}
	}
}

$tg_has_channels = ( '' !== $tg_wa_link || '' !== $tg_tg_link || '' !== $tg_gn_link );
?>
<div id="tg-alerts-drawer" class="tg-alerts-overlay hidden" aria-hidden="true">
	<div data-tg-alerts-close class="tg-alerts-backdrop"></div>

	<aside role="dialog" aria-modal="true" aria-labelledby="tg-alerts-drawer-title" class="tg-alerts-panel">
		<div class="tg-alerts-head">
			<h2 id="tg-alerts-drawer-title" class="tg-alerts-heading">
				<?php echo teoriageek_icon( 'bell', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<span><?php esc_html_e( 'Alertas & Últimas', 'teoriageek' ); ?></span>
			</h2>
			<button type="button" data-tg-alerts-close aria-label="<?php esc_attr_e( 'Fechar alertas', 'teoriageek' ); ?>" class="tg-alerts-close">
				<?php echo teoriageek_icon( 'x', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</button>
		</div>

		<div class="tg-alerts-body">
			<div data-tg-push-prompt class="tg-push-card">
				<p class="tg-push-title"><?php esc_html_e( 'Quer saber das novidades primeiro?', 'teoriageek' ); ?></p>
				<p class="tg-push-desc">
					<?php esc_html_e( 'A gente avisa por aqui sempre que sair trailer novo, crítica ou notícia importante de games, filmes, séries e animes.', 'teoriageek' ); ?>
				</p>
				<div class="tg-push-actions">
					<button type="button" data-tg-push-accept class="tg-push-btn-primary">
						<?php esc_html_e( 'Eu quero!', 'teoriageek' ); ?>
					</button>
					<button type="button" data-tg-push-dismiss class="tg-push-btn-ghost">
						<?php esc_html_e( 'Agora não', 'teoriageek' ); ?>
					</button>
				</div>
				<p data-tg-push-status class="tg-push-status hidden"></p>
				<?php if ( $tg_has_channels ) : ?>
					<div class="tg-push-channels" data-tg-has-channels="1">
						<span><?php esc_html_e( 'Acompanhe também pelo:', 'teoriageek' ); ?></span>
						<?php if ( '' !== $tg_wa_link ) : ?>
							<a href="<?php echo esc_url( $tg_wa_link ); ?>" target="_blank" rel="noopener noreferrer">WhatsApp</a>
						<?php endif; ?>
						<?php if ( '' !== $tg_tg_link ) : ?>
							<a href="<?php echo esc_url( $tg_tg_link ); ?>" target="_blank" rel="noopener noreferrer">Telegram</a>
						<?php endif; ?>
						<?php if ( '' !== $tg_gn_link ) : ?>
							<a href="<?php echo esc_url( $tg_gn_link ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Google Notícias', 'teoriageek' ); ?></a>
						<?php endif; ?>
						<a href="<?php echo esc_url( get_bloginfo( 'rss2_url' ) ); ?>"><?php esc_html_e( 'Feed RSS', 'teoriageek' ); ?></a>
					</div>
				<?php endif; ?>
			</div>

			<div id="tg-alerts-feed" aria-live="polite" class="tg-alerts-feed">
				<p class="tg-alerts-empty"><?php esc_html_e( 'Carregando últimas da redação...', 'teoriageek' ); ?></p>
			</div>
		</div>
	</aside>
</div>
