<?php
/**
 * Teoria Geek — Configuração de recursos do tema, menus, tamanhos de mídia e sidebars.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Inicializa recursos nativos do WordPress.
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
 * Define largura máxima de conteúdo editorial para oEmbeds nativos.
 */
function teoriageek_content_width() {
	$GLOBALS['content_width'] = 800;
}
add_action( 'after_setup_theme', 'teoriageek_content_width', 0 );

/**
 * Registra áreas de widgets e slots opcionais de monetização (AdSense / Site Kit).
 */
function teoriageek_widgets_init() {
	register_sidebar(
		array(
			'name'          => __( 'Topo / Banner (AdSense / Header)', 'teoriageek' ),
			'id'            => 'tg-top-banner',
			'description'   => __( 'Slot opcional abaixo da 1ª dobra. Empilha verticalmente e oculta o rótulo Publicidade quando usado para widgets comuns.', 'teoriageek' ),
			'before_widget' => '<section id="%1$s" class="tg-widget-banner tgx-sidebar-card w-full min-w-0 %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="tg-slot-widget-title mb-3 border-b border-border-subtle pb-2 font-headline text-lg font-extrabold uppercase tracking-wide text-ink-primary">',
			'after_title'   => '</h2>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Meio do Artigo (AdSense In-Article)', 'teoriageek' ),
			'id'            => 'tg-mid-article',
			'description'   => __( 'Slot opcional inserido automaticamente após o 3º parágrafo das matérias.', 'teoriageek' ),
			'before_widget' => '<section id="%1$s" class="tg-widget-mid-article tgx-sidebar-card w-full min-w-0 %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="tg-slot-widget-title mb-3 border-b border-border-subtle pb-2 font-headline text-lg font-extrabold uppercase tracking-wide text-ink-primary">',
			'after_title'   => '</h2>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Sidebar da Matéria & Arquivos', 'teoriageek' ),
			'id'            => 'tg-single-sidebar',
			'description'   => __( 'Exibida na lateral das matérias entre Mais Lidas e o card compacto de Reels.', 'teoriageek' ),
			'before_widget' => '<section id="%1$s" class="tgx-sidebar-card w-full min-w-0 rounded-sm border border-border-subtle bg-surface p-4 %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="mb-3 border-b border-border-subtle pb-2 font-headline text-lg font-extrabold uppercase tracking-wide text-ink-primary">',
			'after_title'   => '</h2>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Rodapé Institucional', 'teoriageek' ),
			'id'            => 'tg-footer-widgets',
			'description'   => __( 'Área opcional no rodapé para avisos, parceiros ou selos (listas extensas recebem rolagem contida).', 'teoriageek' ),
			'before_widget' => '<div id="%1$s" class="tg-footer-widget w-full min-w-0 %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<h2 class="mb-2 font-headline text-base font-bold uppercase tracking-wide text-highlight">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'teoriageek_widgets_init' );

/**
 * Classes semânticas no <body>.
 *
 * @param string[] $classes Classes atuais.
 * @return string[]
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
 * Ajusta comprimento padrão do resumo em cards.
 *
 * @param int $length Tamanho original.
 * @return int
 */
function teoriageek_excerpt_length( $length ) {
	if ( is_admin() ) {
		return $length;
	}
	return 26;
}
add_filter( 'excerpt_length', 'teoriageek_excerpt_length' );

/**
 * Reticências limpas no resumo automático.
 *
 * @param string $more Sufixo original.
 * @return string
 */
function teoriageek_excerpt_more( $more ) {
	if ( is_admin() ) {
		return $more;
	}
	return '…';
}
add_filter( 'excerpt_more', 'teoriageek_excerpt_more' );

/**
 * Atualiza rewrite rules na ativação/troca do tema.
 */
function teoriageek_after_switch_theme() {
	if ( function_exists( 'teoriageek_register_reels_rewrite' ) ) {
		teoriageek_register_reels_rewrite();
	}
	flush_rewrite_rules( false );
}
add_action( 'after_switch_theme', 'teoriageek_after_switch_theme' );

/**
 * Limpa regras de rewrite ao desativar o tema.
 */
function teoriageek_switch_theme() {
	flush_rewrite_rules( false );
}
add_action( 'switch_theme', 'teoriageek_switch_theme' );

/**
 * Garante que a busca pública retorne exclusivamente matérias editoriais publicadas,
 * evitando páginas antigas vazias de construtores visuais nos resultados.
 *
 * @param WP_Query $query Consulta atual.
 */
function teoriageek_refine_search_query( $query ) {
	if ( ! is_admin() && $query->is_main_query() && $query->is_search() ) {
		$query->set( 'post_type', 'post' );
	}
}
add_action( 'pre_get_posts', 'teoriageek_refine_search_query' );

/**
 * Habilita saída condicional em WebP para novos uploads (JPEG/PNG) quando GD ou Imagick suportar.
 *
 * @param array<string, string> $formats Mapa de formatos de saída.
 * @return array<string, string>
 */
function teoriageek_enable_conditional_webp( $formats ) {
	if ( function_exists( 'wp_image_editor_supports' ) && wp_image_editor_supports( array( 'mime_type' => 'image/webp' ) ) ) {
		$formats['image/jpeg'] = 'image/webp';
		$formats['image/png']  = 'image/webp';
	}
	return $formats;
}
add_filter( 'image_editor_output_format', 'teoriageek_enable_conditional_webp' );

/**
 * Remove scripts e estilos nativos de emoji do WordPress para economizar requisições HTTP.
 */
function teoriageek_disable_wp_emojis() {
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
	remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
	add_filter( 'emoji_svg_url', '__return_false' );
}
add_action( 'init', 'teoriageek_disable_wp_emojis' );

/**
 * Aplica folha XSL editorial ao Feed RSS para exibir uma página limpa no navegador em vez de código XML cru.
 */
function teoriageek_style_rss_feed() {
	if ( file_exists( TEORIAGEEK_DIR . '/assets/xsl/rss-style.xsl' ) ) {
		echo '<?xml-stylesheet type="text/xsl" href="' . esc_url( TEORIAGEEK_URI . '/assets/xsl/rss-style.xsl' ) . '"?>' . "
";
	}
}
add_action( 'rss2_ns', 'teoriageek_style_rss_feed', 1 );

/**
 * Aplica filtros seguros de ordenação (?ordem=populares|criticas) em categorias/universos
 * e filtro por editoria/ordenação na busca (?cat=...&orderby=date).
 *
 * @param WP_Query $query Query principal.
 */
function teoriageek_filter_archive_and_search_queries( $query ) {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}

	if ( $query->is_category() || $query->is_tax( 'universo' ) ) {
		$ordem = isset( $_GET['ordem'] ) ? sanitize_key( wp_unslash( $_GET['ordem'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'criticas' === $ordem ) {
			$query->set(
				'meta_query',
				array(
					array(
						'key'     => '_tg_review_score',
						'compare' => 'EXISTS',
					),
				)
			);
		} elseif ( 'populares' === $ordem ) {
			$query->set( 'orderby', 'comment_count date' );
		}
	} elseif ( $query->is_search() ) {
		$cat_id = isset( $_GET['tg_cat'] ) ? absint( $_GET['tg_cat'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( $cat_id > 0 ) {
			$query->set( 'cat', $cat_id );
		}
		$ordem = isset( $_GET['ordem'] ) ? sanitize_key( wp_unslash( $_GET['ordem'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'recentes' === $ordem ) {
			$query->set( 'orderby', 'date' );
			$query->set( 'order', 'DESC' );
		}
	}
}
add_action( 'pre_get_posts', 'teoriageek_filter_archive_and_search_queries' );

/**
 * Limpeza de metadados desnecessários no <head>, bloqueio de XML-RPC/pingbacks e cabeçalhos de segurança HTTP.
 */
function teoriageek_security_and_head_hardening() {
	remove_action( 'wp_head', 'wp_generator' );
	remove_action( 'wp_head', 'rsd_link' );
	remove_action( 'wp_head', 'wlwmanifest_link' );
	remove_action( 'wp_head', 'wp_shortlink_wp_head', 10 );
	remove_action( 'template_redirect', 'wp_shortlink_header', 11 );
}
add_action( 'init', 'teoriageek_security_and_head_hardening' );
add_filter( 'xmlrpc_enabled', '__return_false' );
add_filter(
	'xmlrpc_methods',
	static function ( $methods ) {
		unset( $methods['pingback.ping'], $methods['pingback.extensions.getPingbacks'] );
		return $methods;
	}
);

/**
 * Envia cabeçalhos HTTP básicos de segurança nas respostas públicas do site.
 */
function teoriageek_send_security_headers() {
	if ( headers_sent() || is_admin() ) {
		return;
	}
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Referrer-Policy: strict-origin-when-cross-origin' );
	header( 'Permissions-Policy: camera=(), microphone=(), geolocation=()' );
}
add_action( 'send_headers', 'teoriageek_send_security_headers' );

/**
 * Diagnóstico rápido do tema em Ferramentas -> Diagnóstico do Site (Site Health).
 *
 * @param array<string, mixed> $tests Testes registrados.
 * @return array<string, mixed>
 */
function teoriageek_register_site_health_test( $tests ) {
	$tests['direct']['teoriageek_theme_status'] = array(
		'label' => __( 'Saúde do Tema Teoria Geek', 'teoriageek' ),
		'test'  => 'teoriageek_run_site_health_test',
	);
	return $tests;
}
add_filter( 'site_status_tests', 'teoriageek_register_site_health_test' );

/**
 * Executa a verificação de integridade exibida em Ferramentas > Diagnóstico do Site.
 *
 * @return array<string, mixed>
 */
function teoriageek_run_site_health_test() {
	$bundle_ok = file_exists( TEORIAGEEK_DIR . '/assets/css/bundle.min.css' );
	$notes     = array();
	$notes[]   = $bundle_ok ? __( 'Bundle CSS unificado ativo.', 'teoriageek' ) : __( 'Bundle CSS ausente (usando fallback).', 'teoriageek' );
	$notes[]   = ( defined( 'CKY_VERSION' ) || class_exists( 'CookieYes\Lite\Loader' ) )
		? __( 'CookieYes detectado (banner nativo do tema suprimido).', 'teoriageek' )
		: __( 'Nenhum plugin de cookies detectado (banner LGPD nativo do tema ativo).', 'teoriageek' );
	$notes[]   = function_exists( 'wp_cache_clear_cache' )
		? __( 'WP Super Cache integrado com limpeza automática ao publicar.', 'teoriageek' )
		: __( 'WP Super Cache não detectado.', 'teoriageek' );

	return array(
		'label'       => __( 'Tema Teoria Geek pronto para produção', 'teoriageek' ),
		'status'      => $bundle_ok ? 'good' : 'recommended',
		'badge'       => array(
			'label' => __( 'Teoria Geek', 'teoriageek' ),
			'color' => 'blue',
		),
		'description' => '<p>' . esc_html( implode( ' ', $notes ) ) . '</p>',
		'test'        => 'teoriageek_theme_status',
	);
}
