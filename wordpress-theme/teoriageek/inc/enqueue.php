<?php
/**
 * Teoria Geek — Enfileiramento de CSS/JS autossuficiente e inicialização anti-FOUC.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Script síncrono mínimo no <head> (prioridade 1) para aplicar Modo Claro/Escuro sem flash branco.
 */
function teoriageek_theme_init_script() {
	?>
	<script>
	(function(){
		try {
			var stored = localStorage.getItem('teoriageek-theme');
			var theme = (stored === 'light' || stored === 'dark')
				? stored
				: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
			var root = document.documentElement;
			root.setAttribute('data-theme', theme);
			if (theme === 'dark') root.classList.add('dark');
			else root.classList.remove('dark');
		} catch (e) {
			document.documentElement.setAttribute('data-theme', 'light');
		}
	})();
	</script>
	<?php
}
add_action( 'wp_head', 'teoriageek_theme_init_script', 1 );

/**
 * Preconnect para Google Fonts no <head>.
 *
 * @param array  $urls          Lista de URLs.
 * @param string $relation_type Tipo de relação.
 * @return array
 */
function teoriageek_resource_hints( $urls, $relation_type ) {
	if ( 'preconnect' === $relation_type ) {
		$urls[] = array(
			'href' => 'https://fonts.googleapis.com',
		);
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $urls;
}
add_filter( 'wp_resource_hints', 'teoriageek_resource_hints', 10, 2 );

/**
 * Enfileira fontes, CSS compilado e Vanilla JS com versionamento automático via filemtime().
 */
function teoriageek_enqueue_assets() {
	wp_enqueue_style(
		'teoriageek-fonts',
		'https://fonts.googleapis.com/css2?family=Bangers&family=Barlow+Condensed:wght@600;700;800&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap',
		array(),
		null
	);

	$style_header = TEORIAGEEK_DIR . '/style.css';
	wp_enqueue_style(
		'teoriageek-style',
		get_stylesheet_uri(),
		array(),
		file_exists( $style_header ) ? (string) filemtime( $style_header ) : TEORIAGEEK_VERSION
	);

	$css_file = TEORIAGEEK_DIR . '/assets/css/main.css';
	$css_ver  = file_exists( $css_file ) ? (string) filemtime( $css_file ) : TEORIAGEEK_VERSION;

	wp_enqueue_style(
		'teoriageek-main',
		TEORIAGEEK_URI . '/assets/css/main.css',
		array( 'teoriageek-fonts', 'teoriageek-style' ),
		$css_ver
	);

	$js_file = TEORIAGEEK_DIR . '/assets/js/main.js';
	$js_ver  = file_exists( $js_file ) ? (string) filemtime( $js_file ) : TEORIAGEEK_VERSION;

	wp_enqueue_script(
		'teoriageek-main',
		TEORIAGEEK_URI . '/assets/js/main.js',
		array(),
		$js_ver,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	wp_localize_script(
		'teoriageek-main',
		'teoriageekConfig',
		array(
			'restUrl'        => esc_url_raw( rest_url( 'teoriageek/v1' ) ),
			'wpRestPostsUrl' => esc_url_raw( rest_url( 'wp/v2/posts' ) ),
			'nonce'          => wp_create_nonce( 'wp_rest' ),
			'isSingle'       => is_singular( 'post' ),
			'singlePostId'   => is_singular( 'post' ) ? (int) get_the_ID() : 0,
			'reelsUrl'       => esc_url_raw( teoriageek_get_reels_url() ),
			'homeUrl'        => esc_url_raw( home_url( '/' ) ),
			'siteName'       => (string) get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' ),
			'reelsStampText' => (string) get_theme_mod( 'teoriageek_reels_stamp_text', 'CURTIU!' ),
		)
	);

	if ( teoriageek_is_reels_page() ) {
		$reels_file = TEORIAGEEK_DIR . '/assets/js/reels.js';
		$reels_ver  = file_exists( $reels_file ) ? (string) filemtime( $reels_file ) : TEORIAGEEK_VERSION;

		wp_enqueue_script(
			'teoriageek-reels',
			TEORIAGEEK_URI . '/assets/js/reels.js',
			array( 'teoriageek-main' ),
			$reels_ver,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'teoriageek_enqueue_assets' );
