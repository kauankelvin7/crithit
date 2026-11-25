<?php
/**
 * Teoria Geek — Bootstrapper principal do tema.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TEORIAGEEK_VERSION', '1.0.0' );
define( 'TEORIAGEEK_DIR', get_template_directory() );
define( 'TEORIAGEEK_URI', get_template_directory_uri() );

require_once TEORIAGEEK_DIR . '/inc/helpers.php';
require_once TEORIAGEEK_DIR . '/inc/setup.php';
require_once TEORIAGEEK_DIR . '/inc/enqueue.php';
require_once TEORIAGEEK_DIR . '/inc/legacy-sanitizer.php';
require_once TEORIAGEEK_DIR . '/inc/customizer.php';
require_once TEORIAGEEK_DIR . '/inc/meta-boxes.php';
require_once TEORIAGEEK_DIR . '/inc/template-tags.php';
require_once TEORIAGEEK_DIR . '/inc/reels-api.php';
