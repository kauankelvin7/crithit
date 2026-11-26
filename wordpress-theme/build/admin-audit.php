<?php
/**
 * Auditoria somente-leitura da experiência do Gestor / Editor do WordPress no PHP 8.3.
 * Executa fora do tema (não é empacotado no ZIP) e não grava nenhuma alteração no banco.
 */
error_reporting( E_ALL );
ini_set( 'display_errors', '1' );

$php_issues = array();
set_error_handler(
	static function ( $errno, $errstr, $errfile, $errline ) use ( &$php_issues ) {
		// Captura apenas avisos originados dentro do nosso tema teoriageek.
		if ( false !== stripos( (string) $errfile, 'teoriageek' ) ) {
			$php_issues[] = sprintf( '[%d] %s in %s:%d', $errno, $errstr, basename( (string) $errfile ), $errline );
		}
		return false;
	}
);

$_SERVER['HTTP_HOST']   = 'teoriageek.local';
$_SERVER['REQUEST_URI'] = '/';

require_once 'C:/Users/kelvi/Local Sites/teoriageek/app/public/wp-load.php';

echo "=== 1. WP_GET_THEME() ===\n";
$theme = wp_get_theme( 'teoriageek' );
echo 'Name: ' . $theme->get( 'Name' ) . ' | Version: ' . $theme->get( 'Version' ) . "\n";
echo 'Screenshot: ' . ( $theme->get_screenshot() ? 'OK' : 'MISSING' ) . "\n";
echo 'Theme Errors: ' . ( $theme->errors() ? $theme->errors()->get_error_message() : 'NONE' ) . "\n";

echo "\n=== 2. CUSTOMIZER (WP_Customize_Manager) ===\n";
require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
$wp_customize = new WP_Customize_Manager();
do_action( 'customize_register', $wp_customize );
foreach ( $wp_customize->sections() as $sid => $sec ) {
	if ( 0 === strpos( $sid, 'teoriageek_' ) ) {
		echo sprintf( "Section [%s]: %s\n", $sid, $sec->title );
	}
}
$tg_controls = array();
foreach ( $wp_customize->controls() as $cid => $ctrl ) {
	if ( 0 === strpos( $cid, 'teoriageek_' ) ) {
		$tg_controls[] = sprintf( '%s (%s -> %s)', $cid, get_class( $ctrl ), $ctrl->section );
	}
}
echo 'Total Teoria Geek controls: ' . count( $tg_controls ) . "\n";
foreach ( $tg_controls as $line ) {
	echo "  - {$line}\n";
}

echo "\n=== 3. META BOX FICHA EDITORIAL (RENDER TEST) ===\n";
$sample_post = get_post( 194396 );
if ( $sample_post instanceof WP_Post ) {
	ob_start();
	teoriageek_render_editorial_meta_box( $sample_post );
	$mb_html = (string) ob_get_clean();
	echo 'Rendered MetaBox HTML length: ' . strlen( $mb_html ) . " bytes\n";
	echo 'Has nonce field: ' . ( false !== strpos( $mb_html, 'teoriageek_editorial_nonce' ) ? 'YES' : 'NO' ) . "\n";
	echo 'Review details for 194396 (VisionQuest): ' . wp_json_encode( teoriageek_get_review_details( 194396 ) ) . "\n";
}

echo "\n=== 4. WIDGETS / AD SLOTS & MENUS ===\n";
global $wp_registered_sidebars;
foreach ( array( 'tg-top-banner', 'tg-mid-article', 'tg-single-sidebar', 'tg-footer-widgets' ) as $sb ) {
	echo sprintf( "Sidebar [%s]: %s\n", $sb, isset( $wp_registered_sidebars[ $sb ] ) ? $wp_registered_sidebars[ $sb ]['name'] : 'MISSING' );
}
echo 'Registered nav menus: ' . wp_json_encode( get_registered_nav_menus(), JSON_UNESCAPED_UNICODE ) . "\n";
echo 'Assigned nav locations: ' . wp_json_encode( get_nav_menu_locations() ) . "\n";

echo "\n=== 5. THEME.JSON & PERFORMANCE BENCHMARK ===\n";
$theme_json = WP_Theme_JSON_Resolver::get_theme_data();
$palette    = $theme_json->get_settings()['color']['palette']['theme'] ?? array();
echo 'theme.json palette entries: ' . count( $palette ) . "\n";

$t0    = microtime( true );
$most7 = teoriageek_get_most_read_posts( 5, array(), '7d' );
$ms7   = round( ( microtime( true ) - $t0 ) * 1000, 2 );
echo sprintf( "Most Read 7d (wp_post_views): %d posts in %sms\n", count( $most7 ), $ms7 );

$t1    = microtime( true );
$most1 = teoriageek_get_most_read_posts( 5, array(), '24h' );
$ms1   = round( ( microtime( true ) - $t1 ) * 1000, 2 );
echo sprintf( "Most Read 24h (wp_post_views): %d posts in %sms\n", count( $most1 ), $ms1 );

echo "\n=== 5B. PHASE 4 FEATURES (UNIVERSO, SPOILER, MOJIBAKE, PREMIERES, SEO) ===\n";
echo 'Taxonomy universo registered: ' . ( taxonomy_exists( 'universo' ) ? 'YES' : 'NO' ) . "\n";
echo 'Shortcode [spoiler] registered: ' . ( shortcode_exists( 'spoiler' ) ? 'YES' : 'NO' ) . "\n";
$spoiler_out = do_shortcode( '[spoiler title="Final secreto"]Conteúdo protegido[/spoiler]' );
echo 'Shortcode [spoiler] output contains <details>: ' . ( false !== strpos( $spoiler_out, '<details' ) ? 'YES' : 'NO' ) . "\n";
$mojibake_sample = "J\xE2\x94\x9C\xC3\xAD at\xE2\x94\x9C\xC2\xAE An\xE2\x94\x9C\xC2\xAEis espa\xE2\x94\x9C\xC2\xBAo";
$mojibake_fixed  = teoriageek_fix_mojibake( $mojibake_sample );
echo 'Mojibake repair test: ' . $mojibake_fixed . ' | OK=' . ( 'Já até Anéis espaço' === $mojibake_fixed ? 'YES' : 'NO' ) . "\n";
$premieres = teoriageek_get_weekly_premieres();
echo 'Weekly premieres items: ' . count( $premieres ) . "\n";
$schema_vq = teoriageek_build_single_schema( 194396 );
echo 'VisionQuest JSON-LD @type: ' . ( $schema_vq['@type'] ?? 'MISSING' ) . ' | rating=' . ( $schema_vq['reviewRating']['ratingValue'] ?? 'NONE' ) . "\n";

echo "\n=== 6. PHP 8.3 THEME WARNINGS/NOTICES/DEPRECATIONS ===\n";
echo 'Total theme PHP issues: ' . count( $php_issues ) . "\n";
foreach ( $php_issues as $iss ) {
	echo "  ! {$iss}\n";
}
exit( count( $php_issues ) > 0 ? 1 : 0 );
