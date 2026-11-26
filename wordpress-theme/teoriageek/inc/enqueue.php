<?php
/**
 * Teoria Geek — Enfileiramento autossuficiente (fontes .woff2 locais sem Google Fonts externo)
 * e inicialização anti-FOUC.
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
 * Preload seletivo das duas fontes principais (manchete + interface) para zero atraso no LCP.
 */
function teoriageek_preload_critical_fonts() {
	$critical = array(
		'/assets/fonts/barlow-condensed-700-latin.woff2',
		'/assets/fonts/space-grotesk-500-latin.woff2',
	);
	foreach ( $critical as $rel ) {
		if ( file_exists( TEORIAGEEK_DIR . $rel ) ) {
			echo '<link rel="preload" href="' . esc_url( TEORIAGEEK_URI . $rel ) . '" as="font" type="font/woff2" crossorigin />' . "\n";
		}
	}
}
add_action( 'wp_head', 'teoriageek_preload_critical_fonts', 2 );

/**
 * Enfileira CSS compilado (com fontes .woff2 auto-hospedadas) e Vanilla JS com cache-busting via filemtime().
 */
function teoriageek_enqueue_assets() {
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
		array( 'teoriageek-style' ),
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
