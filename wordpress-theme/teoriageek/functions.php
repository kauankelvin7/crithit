<?php
/**
 * Teoria Geek — Bootstrapper principal do tema.
 *
 * Carrega os módulos internos do tema (helpers, setup, taxonomias, SEO, enfileiramento,
 * sanitização de acervo legado, Personalizador, meta boxes editoriais, template tags,
 * Analytics First-Party, REST API pública, Módulo de Quizzes e Central Teoria Geek,
 * carregados diretamente no bootstrapper para registrar todas as rotas REST em `/wp-json/`).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TEORIAGEEK_VERSION', '2.13.0' );
define( 'TEORIAGEEK_DIR', get_template_directory() );
define( 'TEORIAGEEK_URI', get_template_directory_uri() );

require_once TEORIAGEEK_DIR . '/inc/helpers.php';
require_once TEORIAGEEK_DIR . '/inc/setup.php';
require_once TEORIAGEEK_DIR . '/inc/taxonomies.php';
require_once TEORIAGEEK_DIR . '/inc/seo.php';
require_once TEORIAGEEK_DIR . '/inc/enqueue.php';
require_once TEORIAGEEK_DIR . '/inc/legacy-sanitizer.php';
require_once TEORIAGEEK_DIR . '/inc/customizer.php';
require_once TEORIAGEEK_DIR . '/inc/meta-boxes.php';
require_once TEORIAGEEK_DIR . '/inc/template-tags.php';
require_once TEORIAGEEK_DIR . '/inc/analytics.php';
require_once TEORIAGEEK_DIR . '/inc/reels-api.php';
require_once TEORIAGEEK_DIR . '/inc/quizzes.php';
require_once TEORIAGEEK_DIR . '/inc/admin-dashboard.php';
