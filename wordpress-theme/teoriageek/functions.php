<?php
/**
 * Teoria Geek Editorial — Funções principais e inicialização do tema.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TEORIAGEEK_VERSION', '1.0.0' );
define( 'TEORIAGEEK_DIR', get_template_directory() );
define( 'TEORIAGEEK_URI', get_template_directory_uri() );

/**
 * Carrega módulos internos do tema.
 */
require_once TEORIAGEEK_DIR . '/inc/helpers.php';
require_once TEORIAGEEK_DIR . '/inc/customizer.php';
require_once TEORIAGEEK_DIR . '/inc/meta-boxes.php';
require_once TEORIAGEEK_DIR . '/inc/template-tags.php';
if ( file_exists( TEORIAGEEK_DIR . '/inc/reels-api.php' ) ) {
	require_once TEORIAGEEK_DIR . '/inc/reels-api.php';
}

/**
 * Configuração inicial de recursos suportados pelo WordPress.
 */
function teoriageek_setup() {
	load_theme_textdomain( 'teoriageek', TEORIAGEEK_DIR . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'customize-selective-refresh-widgets' );

	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	add_theme_support(
		'custom-logo',
		array(
			'height'      => 190,
			'width'       => 300,
			'flex-height' => true,
			'flex-width'  => true,
		)
	);

	// Tamanhos de imagem editoriais otimizados para fotos 16:9 e Reels.
	add_image_size( 'tg-hero', 1280, 720, true );
	add_image_size( 'tg-card', 640, 360, true );
	add_image_size( 'tg-thumb', 320, 180, true );

	register_nav_menus(
		array(
			'primary' => __( 'Menu Principal do Cabeçalho', 'teoriageek' ),
			'footer'  => __( 'Menu do Rodapé (Editorias / Institucional)', 'teoriageek' ),
		)
	);
}
add_action( 'after_setup_theme', 'teoriageek_setup' );

/**
 * Define largura máxima de conteúdo editorial para embeds nativos.
 */
function teoriageek_content_width() {
	$GLOBALS['content_width'] = 800;
}
add_action( 'after_setup_theme', 'teoriageek_content_width', 0 );

/**
 * Registra áreas de widgets / anúncios opcionais (só renderizadas quando ativas).
 */
function teoriageek_widgets_init() {
	register_sidebar(
		array(
			'name'          => __( 'Topo / Banner (Opcional)', 'teoriageek' ),
			'id'            => 'tg-top-banner',
			'description'   => __( 'Área discreta abaixo do cabeçalho para banners ou AdSense. Só aparece se houver widgets.', 'teoriageek' ),
			'before_widget' => '<div id="%1$s" class="tg-widget-banner %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<span class="sr-only">',
			'after_title'   => '</span>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Sidebar da Matéria (Opcional)', 'teoriageek' ),
			'id'            => 'tg-single-sidebar',
			'description'   => __( 'Exibida na lateral das matérias entre Mais Lidas e o card compacto de Reels.', 'teoriageek' ),
			'before_widget' => '<section id="%1$s" class="rounded border-2 border-border-strong bg-surface p-4 shadow-hard-sm %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="mb-3 border-b-2 border-border-strong pb-2 font-headline text-xl font-extrabold uppercase tracking-tight text-ink-primary">',
			'after_title'   => '</h2>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Rodapé (Opcional)', 'teoriageek' ),
			'id'            => 'tg-footer-widgets',
			'description'   => __( 'Área opcional no rodapé para newsletter, selos ou links institucionais.', 'teoriageek' ),
			'before_widget' => '<div id="%1$s" class="tg-footer-widget %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<h2 class="mb-2 font-headline text-lg font-bold uppercase tracking-wide text-highlight">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'teoriageek_widgets_init' );

/**
 * Script inline anti-FOUC no <head> (prioridade 1) para aplicar Modo Claro/Escuro antes do primeiro paint.
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
 * Enfileira fontes, CSS compilado e scripts modulares Vanilla JS.
 */
function teoriageek_enqueue_assets() {
	// Fontes editoriais com display=swap (fallbacks locais já configurados no CSS).
	wp_enqueue_style(
		'teoriageek-fonts',
		'https://fonts.googleapis.com/css2?family=Bangers&family=Barlow+Condensed:wght@600;700;800&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap',
		array(),
		null
	);

	$css_file = TEORIAGEEK_DIR . '/assets/css/main.css';
	$css_ver  = file_exists( $css_file ) ? (string) filemtime( $css_file ) : TEORIAGEEK_VERSION;

	wp_enqueue_style(
		'teoriageek-main',
		TEORIAGEEK_URI . '/assets/css/main.css',
		array( 'teoriageek-fonts' ),
		$css_ver
	);

	// Injeta cores configuradas no Personalizador (Aparência > Personalizar).
	$custom_css = teoriageek_get_customizer_css();
	if ( ! empty( $custom_css ) ) {
		wp_add_inline_style( 'teoriageek-main', $custom_css );
	}

	// Script global Vanilla JS (tema, menu mobile, busca, curtidas/salvos/share e views).
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
			'nonce'          => wp_create_nonce( 'wp_rest' ),
			'isSingle'       => is_singular( 'post' ),
			'singlePostId'   => is_singular( 'post' ) ? get_the_ID() : 0,
			'reelsUrl'       => esc_url_raw( teoriageek_get_reels_url() ),
			'homeUrl'        => esc_url_raw( home_url( '/' ) ),
			'siteName'       => get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' ),
			'reelsStampText' => get_theme_mod( 'teoriageek_reels_stamp_text', 'CURTIU!' ),
		)
	);

	// Script dedicado do player Reels 2.0 (carregado apenas na rota /reels/).
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
 * Adiciona classe identificadora ao <body> na tela imersiva de Reels.
 *
 * @param array $classes Classes atuais do body.
 * @return array
 */
function teoriageek_body_classes( $classes ) {
	if ( teoriageek_is_reels_page() ) {
		$classes[] = 'tg-reels-page';
		$classes[] = 'overflow-hidden';
	}
	return $classes;
}
add_filter( 'body_class', 'teoriageek_body_classes' );

/**
 * Limpa comprimento padrão do excerpt para manter cards limpos.
 *
 * @return int
 */
function teoriageek_excerpt_length() {
	return 24;
}
add_filter( 'excerpt_length', 'teoriageek_excerpt_length' );

/**
 * Sufixo limpo para excerpt.
 *
 * @return string
 */
function teoriageek_excerpt_more() {
	return '…';
}
add_filter( 'excerpt_more', 'teoriageek_excerpt_more' );

/**
 * Atualiza regras de rewrite ao ativar/desativar o tema para habilitar /reels/ automaticamente.
 */
function teoriageek_after_switch_theme() {
	if ( function_exists( 'teoriageek_register_reels_rewrite' ) ) {
		teoriageek_register_reels_rewrite();
	}
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'teoriageek_after_switch_theme' );

function teoriageek_switch_theme() {
	flush_rewrite_rules();
}
add_action( 'switch_theme', 'teoriageek_switch_theme' );
