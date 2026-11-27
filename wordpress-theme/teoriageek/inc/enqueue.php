<?php
/**
 * Teoria Geek — Enfileiramento autossuficiente (bundle CSS único + fontes .woff2 locais + preload LCP)
 * e inicialização anti-FOUC com theme-color dinâmico.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Script síncrono mínimo no <head> (prioridade 1) para aplicar Modo Claro/Escuro sem flash branco
 * e sincronizar <meta name="theme-color"> imediatamente.
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
			var meta = document.getElementById('tg-theme-color-meta') || document.querySelector('meta[name="theme-color"]');
			if (meta) meta.setAttribute('content', theme === 'dark' ? '#102042' : '#FFFFFF');
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
		'/assets/fonts/plus-jakarta-sans-400-latin.woff2',
	);
	foreach ( $critical as $rel ) {
		if ( file_exists( TEORIAGEEK_DIR . $rel ) ) {
			echo '<link rel="preload" href="' . esc_url( TEORIAGEEK_URI . $rel ) . '" as="font" type="font/woff2" crossorigin />' . "\n";
		}
	}
}
add_action( 'wp_head', 'teoriageek_preload_critical_fonts', 2 );

/**
 * Preload da imagem LCP principal na Home (Slide 0) e em matérias individuais (single.php).
 */
function teoriageek_preload_lcp_image() {
	if ( is_admin() || is_feed() ) {
		return;
	}
	$lcp_url = '';
	if ( is_front_page() && function_exists( 'teoriageek_get_home_blocks' ) ) {
		$blocks = teoriageek_get_home_blocks();
		$first  = ! empty( $blocks['hero_slides'][0] ) ? $blocks['hero_slides'][0] : ( $blocks['hero'] ?? null );
		if ( $first instanceof WP_Post ) {
			$lcp_url = (string) get_the_post_thumbnail_url( (int) $first->ID, 'tg-hero' );
		}
	} elseif ( is_singular( 'post' ) ) {
		$lcp_url = (string) get_the_post_thumbnail_url( (int) get_queried_object_id(), 'tg-hero' );
	}
	if ( '' !== $lcp_url ) {
		echo '<link rel="preload" as="image" href="' . esc_url( $lcp_url ) . '" fetchpriority="high" />' . "\n";
	}
}
add_action( 'wp_head', 'teoriageek_preload_lcp_image', 3 );

/**
 * Enfileira bundle CSS unificado (1 requisição bloqueante em vez de 5) e Vanilla JS com cache-busting via filemtime().
 */
function teoriageek_enqueue_assets() {
	$bundle_file = TEORIAGEEK_DIR . '/assets/css/bundle.min.css';
	if ( file_exists( $bundle_file ) ) {
		wp_enqueue_style(
			'teoriageek-bundle',
			TEORIAGEEK_URI . '/assets/css/bundle.min.css',
			array(),
			(string) filemtime( $bundle_file )
		);
	} else {
		$css_file = TEORIAGEEK_DIR . '/assets/css/main.css';
		$css_ver  = file_exists( $css_file ) ? (string) filemtime( $css_file ) : TEORIAGEEK_VERSION;
		wp_enqueue_style( 'teoriageek-main', TEORIAGEEK_URI . '/assets/css/main.css', array(), $css_ver );
		foreach ( array( 'responsive', 'enhancements', 'design-system' ) as $slug ) {
			$p = TEORIAGEEK_DIR . '/assets/css/' . $slug . '.css';
			if ( file_exists( $p ) ) {
				wp_enqueue_style( 'teoriageek-' . $slug, TEORIAGEEK_URI . '/assets/css/' . $slug . '.css', array( 'teoriageek-main' ), (string) filemtime( $p ) );
			}
		}
	}

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

	$enh_js_file = TEORIAGEEK_DIR . '/assets/js/enhancements.js';
	if ( file_exists( $enh_js_file ) ) {
		wp_enqueue_script(
			'teoriageek-enhancements',
			TEORIAGEEK_URI . '/assets/js/enhancements.js',
			array( 'teoriageek-main' ),
			(string) filemtime( $enh_js_file ),
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

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

/**
 * Remove CSS pesado de blocos Gutenberg na Home e arquivos (mantém ativo em artigos e páginas).
 */
function teoriageek_dequeue_unused_block_css() {
	if ( is_admin() || is_singular() ) {
		return;
	}
	wp_dequeue_style( 'wp-block-library' );
	wp_dequeue_style( 'wp-block-library-theme' );
	wp_dequeue_style( 'classic-theme-styles' );
}
add_action( 'wp_enqueue_scripts', 'teoriageek_dequeue_unused_block_css', 100 );

/**
 * Adiciona dns-prefetch condicional apenas quando o artigo tem vídeo incorporado.
 */
function teoriageek_conditional_resource_hints() {
	if ( is_singular( 'post' ) && function_exists( 'teoriageek_post_has_video' ) && teoriageek_post_has_video( (int) get_queried_object_id() ) ) {
		echo '<link rel="dns-prefetch" href="//i.ytimg.com" />' . "
";
	}
}
add_action( 'wp_head', 'teoriageek_conditional_resource_hints', 4 );
