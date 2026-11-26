<?php
/**
 * Template Part: Aviso nativo de Cookies / LGPD (auto-suprimido quando plugins dedicados como CookieYes estão ativos).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Não duplica aviso se um plugin dedicado de LGPD/Cookies já estiver ativo (ex.: CookieYes em produção).
if (
	defined( 'CKY_VERSION' )
	|| defined( 'CLI_VERSION' )
	|| defined( 'CLI_LATEST_VERSION_NUMBER' )
	|| defined( 'CMPLZ_VERSION' )
	|| function_exists( 'cky_is_banner_active' )
	|| class_exists( 'Cookie_Law_Info' )
	|| class_exists( 'Cookie_Notice' )
	|| class_exists( 'CookieYes\\Lite\\Loader' )
	|| teoriageek_is_reels_page()
) {
	return;
}

$tg_privacy_url = get_privacy_policy_url();
if ( '' === $tg_privacy_url ) {
	$tg_priv_page = get_page_by_path( 'politica-de-privacidade' );
	if ( $tg_priv_page instanceof WP_Post && 'publish' === $tg_priv_page->post_status ) {
		$tg_privacy_url = (string) get_permalink( $tg_priv_page->ID );
	}
}
?>
<aside id="tg-cookie-banner" role="dialog" aria-live="polite" aria-label="<?php esc_attr_e( 'Aviso de privacidade e cookies', 'teoriageek' ); ?>" class="tgx-cookie-banner" hidden>
	<div class="tgx-cookie-inner">
		<div class="tgx-cookie-copy">
			<p class="tgx-cookie-title"><?php esc_html_e( 'Privacidade e Cookies (LGPD)', 'teoriageek' ); ?></p>
			<p class="tgx-cookie-text">
				<?php esc_html_e( 'Utilizamos cookies essenciais e de preferência (como modo claro/escuro e matérias salvas) para melhorar sua leitura no Teoria Geek.', 'teoriageek' ); ?>
				<?php if ( '' !== $tg_privacy_url ) : ?>
					<a href="<?php echo esc_url( $tg_privacy_url ); ?>" class="tgx-cookie-link"><?php esc_html_e( 'Política de Privacidade', 'teoriageek' ); ?></a>.
				<?php endif; ?>
			</p>
		</div>
		<div class="tgx-cookie-actions">
			<button type="button" data-tg-cookie-choice="essential" class="tgx-cookie-btn-sec">
				<?php esc_html_e( 'Apenas essenciais', 'teoriageek' ); ?>
			</button>
			<button type="button" data-tg-cookie-choice="accepted" class="tgx-cookie-btn-pri">
				<?php esc_html_e( 'Aceitar cookies', 'teoriageek' ); ?>
			</button>
		</div>
	</div>
</aside>
