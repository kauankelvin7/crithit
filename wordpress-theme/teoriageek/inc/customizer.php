<?php
/**
 * Teoria Geek — Personalizador do WordPress (Aparência > Personalizar).
 * Seção "Cores e Identidade — Teoria Geek" com variáveis CSS :root (--tg-primary, --tg-accent,
 * --tg-bg, --tg-surface, --tg-text) injetadas dinamicamente via wp_head, logo, redes sociais,
 * categorias da Home e slots opcionais de anúncios sem CLS.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Lista dinâmica de categorias reais do banco para seleção no Customizer.
 *
 * @return array<string, string>
 */
function teoriageek_customizer_category_choices() {
	$choices = array( '' => __( '— Selecionar automaticamente —', 'teoriageek' ) );
	$terms   = get_categories(
		array(
			'hide_empty' => false,
			'orderby'    => 'count',
			'order'      => 'DESC',
		)
	);

	if ( ! is_wp_error( $terms ) ) {
		foreach ( $terms as $term ) {
			$choices[ $term->slug ] = sprintf( '%s (%d)', html_entity_decode( $term->name, ENT_QUOTES, 'UTF-8' ), (int) $term->count );
		}
	}

	return $choices;
}

/**
 * Sanitiza código HTML/AdSense de anúncios apenas para administradores com `unfiltered_html`.
 *
 * @param string $input Código inserido.
 * @return string
 */
function teoriageek_sanitize_ad_code( $input ) {
	if ( current_user_can( 'unfiltered_html' ) ) {
		return (string) $input;
	}
	return wp_kses_post( (string) $input );
}

/**
 * Registra seções e controles no Personalizador (`customize_register`).
 *
 * @param WP_Customize_Manager $wp_customize Instância do Customizer.
 */
function teoriageek_customize_register( $wp_customize ) {
	// =========================================================================
	// 1. CORES E IDENTIDADE — TEORIA GEEK (--tg-primary, --tg-accent, --tg-bg, --tg-surface, --tg-text + Logo)
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_colors_identity',
		array(
			'title'       => __( 'Cores e Identidade — Teoria Geek', 'teoriageek' ),
			'description' => __( 'Controle a identidade Azul e Amarelo, superfícies, texto e logotipo do portal. Fundos amarelos aplicam automaticamente texto escuro (#0B0F19) de alto contraste.', 'teoriageek' ),
			'priority'    => 30,
		)
	);

	$wp_customize->add_setting(
		'teoriageek_site_name',
		array(
			'default'           => 'Teoria Geek',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'teoriageek_site_name',
		array(
			'label'       => __( 'Nome do Portal (Selo da Marca)', 'teoriageek' ),
			'description' => __( 'Exibido no cabeçalho caso nenhuma imagem de logo esteja ativa.', 'teoriageek' ),
			'section'     => 'teoriageek_colors_identity',
			'type'        => 'text',
		)
	);

	$wp_customize->add_setting(
		'teoriageek_logo_dark',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Image_Control(
			$wp_customize,
			'teoriageek_logo_dark',
			array(
				'label'       => __( 'Logo do Cabeçalho (Opcional)', 'teoriageek' ),
				'description' => __( 'Se vazia, o tema utiliza a Logo padrão de Identidade do Site ou o selo tipográfico Teoria Geek.', 'teoriageek' ),
				'section'     => 'teoriageek_colors_identity',
			)
		)
	);

	$color_controls = array(
		'teoriageek_color_primary' => array(
			'label'   => __( 'Cor Primária Estrutural / Azul (--tg-primary)', 'teoriageek' ),
			'default' => '#1D4ED8',
		),
		'teoriageek_color_accent'  => array(
			'label'   => __( 'Cor de Destaque Editorial / Amarelo (--tg-accent)', 'teoriageek' ),
			'default' => '#FACC15',
		),
		'teoriageek_color_bg'      => array(
			'label'   => __( 'Cor de Fundo da Página (--tg-bg)', 'teoriageek' ),
			'default' => '#FFFFFF',
		),
		'teoriageek_color_surface' => array(
			'label'   => __( 'Cor de Superfície / Cards (--tg-surface)', 'teoriageek' ),
			'default' => '#FFFFFF',
		),
		'teoriageek_color_text'    => array(
			'label'   => __( 'Cor do Texto Principal (--tg-text)', 'teoriageek' ),
			'default' => '#0B0F19',
		),
	);

	foreach ( $color_controls as $setting_id => $cfg ) {
		$wp_customize->add_setting(
			$setting_id,
			array(
				'default'           => $cfg['default'],
				'sanitize_callback' => 'sanitize_hex_color',
			)
		);
		$wp_customize->add_control(
			new WP_Customize_Color_Control(
				$wp_customize,
				$setting_id,
				array(
					'label'   => $cfg['label'],
					'section' => 'teoriageek_colors_identity',
				)
			)
		);
	}

	// =========================================================================
	// 2. CATEGORIAS DA HOME
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_home_categories',
		array(
			'title'       => __( 'Categorias da Capa — Teoria Geek', 'teoriageek' ),
			'description' => __( 'Selecione quais categorias reais alimentam cada seção da página inicial.', 'teoriageek' ),
			'priority'    => 35,
		)
	);

	$choices    = teoriageek_customizer_category_choices();
	$cat_fields = array(
		'destaque'  => array( __( 'Bloco Hero / Destaques Principais', 'teoriageek' ), 'destaque' ),
		'noticias'  => array( __( 'Plantão Geek & Giro de Notícias', 'teoriageek' ), 'noticias' ),
		'criticas'  => array( __( 'Seção de Críticas', 'teoriageek' ), 'criticas' ),
		'reviews'   => array( __( 'Seção de Reviews', 'teoriageek' ), 'reviews' ),
		'especiais' => array( __( 'Seção de Especiais & Colunas', 'teoriageek' ), 'especial-teoria-geek' ),
		'col_1'     => array( __( 'Coluna de Editoria 1', 'teoriageek' ), 'games' ),
		'col_2'     => array( __( 'Coluna de Editoria 2', 'teoriageek' ), 'filmes' ),
		'col_3'     => array( __( 'Coluna de Editoria 3', 'teoriageek' ), 'series' ),
		'col_4'     => array( __( 'Coluna de Editoria 4', 'teoriageek' ), 'animes-mangas' ),
		'col_5'     => array( __( 'Coluna de Editoria 5', 'teoriageek' ), 'livros-hqs' ),
	);

	foreach ( $cat_fields as $key => $cfg ) {
		$wp_customize->add_setting(
			'teoriageek_cat_' . $key,
			array(
				'default'           => $cfg[1],
				'sanitize_callback' => 'sanitize_title',
			)
		);
		$wp_customize->add_control(
			'teoriageek_cat_' . $key,
			array(
				'label'   => $cfg[0],
				'section' => 'teoriageek_home_categories',
				'type'    => 'select',
				'choices' => $choices,
			)
		);
	}

	// =========================================================================
	// 3. REDES SOCIAIS & REELS
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_socials_and_reels',
		array(
			'title'       => __( 'Redes Sociais & Reels — Teoria Geek', 'teoriageek' ),
			'description' => __( 'Links oficiais exibidos no cabeçalho/rodapé e selo de curtida nos Reels.', 'teoriageek' ),
			'priority'    => 36,
		)
	);

	$socials = array(
		'instagram' => array( 'Instagram', 'https://www.instagram.com/teoria.geek' ),
		'youtube'   => array( 'YouTube', 'https://www.youtube.com/channel/UCgZV_gtBut_mNmFQtIx9KEQ' ),
		'spotify'   => array( 'Spotify', 'https://open.spotify.com/show/5MJY6UjHHW6Gne68xfw3Rz' ),
		'twitch'    => array( 'Twitch', 'https://www.twitch.tv/teoriageekgames' ),
		'twitter'   => array( 'X / Twitter', 'https://twitter.com/teoriageeks' ),
		'facebook'  => array( 'Facebook', 'https://www.facebook.com/TeoriaGeeks' ),
	);

	foreach ( $socials as $slug => $meta ) {
		$wp_customize->add_setting(
			'teoriageek_social_' . $slug,
			array(
				'default'           => $meta[1],
				'sanitize_callback' => 'esc_url_raw',
			)
		);
		$wp_customize->add_control(
			'teoriageek_social_' . $slug,
			array(
				'label'   => $meta[0],
				'section' => 'teoriageek_socials_and_reels',
				'type'    => 'url',
			)
		);
	}

	$wp_customize->add_setting(
		'teoriageek_reels_stamp_text',
		array(
			'default'           => 'CURTIU!',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'teoriageek_reels_stamp_text',
		array(
			'label'   => __( 'Texto do selo nos Reels', 'teoriageek' ),
			'section' => 'teoriageek_socials_and_reels',
			'type'    => 'text',
		)
	);

	// =========================================================================
	// 4. MONETIZAÇÃO & ADSENSE (SEM CLS)
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_monetization',
		array(
			'title'       => __( 'Monetização & Anúncios — Teoria Geek', 'teoriageek' ),
			'description' => __( 'Slots opcionais compatíveis com Google Site Kit / AdSense com reserva de espaço sem salto de layout (CLS).', 'teoriageek' ),
			'priority'    => 37,
		)
	);

	$ad_slots = array(
		'top'         => __( 'Código de Anúncio — Topo (Leaderboard 90px)', 'teoriageek' ),
		'mid_article' => __( 'Código de Anúncio — Meio do Artigo (In-Article 250px)', 'teoriageek' ),
		'sidebar'     => __( 'Código de Anúncio — Sidebar Lateral (Retângulo 250px)', 'teoriageek' ),
	);

	foreach ( $ad_slots as $slot_key => $label ) {
		$wp_customize->add_setting(
			'teoriageek_ad_' . $slot_key,
			array(
				'default'           => '',
				'sanitize_callback' => 'teoriageek_sanitize_ad_code',
			)
		);
		$wp_customize->add_control(
			'teoriageek_ad_' . $slot_key,
			array(
				'label'       => $label,
				'description' => __( 'Deixe vazio caso utilize Widgets ou Site Kit Auto Ads.', 'teoriageek' ),
				'section'     => 'teoriageek_monetization',
				'type'        => 'textarea',
			)
		);
	}

	// Selo "Oferecimento" patrocinado por Editoria.
	$wp_customize->add_setting(
		'teoriageek_sponsor_category',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_title',
		)
	);
	$wp_customize->add_control(
		'teoriageek_sponsor_category',
		array(
			'label'   => __( 'Selo "Oferecimento" — Editoria Patrocinada', 'teoriageek' ),
			'section' => 'teoriageek_monetization',
			'type'    => 'select',
			'choices' => $choices,
		)
	);

	$wp_customize->add_setting(
		'teoriageek_sponsor_label',
		array(
			'default'           => 'Oferecimento',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'teoriageek_sponsor_label',
		array(
			'label'   => __( 'Selo "Oferecimento" — Rótulo', 'teoriageek' ),
			'section' => 'teoriageek_monetization',
			'type'    => 'text',
		)
	);

	$wp_customize->add_setting(
		'teoriageek_sponsor_name',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'teoriageek_sponsor_name',
		array(
			'label'       => __( 'Selo "Oferecimento" — Nome do Parceiro', 'teoriageek' ),
			'description' => __( 'Exibido no cabeçalho da editoria selecionada quando preenchido.', 'teoriageek' ),
			'section'     => 'teoriageek_monetization',
			'type'        => 'text',
		)
	);

	$wp_customize->add_setting(
		'teoriageek_sponsor_url',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);
	$wp_customize->add_control(
		'teoriageek_sponsor_url',
		array(
			'label'   => __( 'Selo "Oferecimento" — Link do Parceiro (Opcional)', 'teoriageek' ),
			'section' => 'teoriageek_monetization',
			'type'    => 'url',
		)
	);

	// =========================================================================
	// 5. RECURSOS EDITORIAIS: ESTREIAS DA SEMANA & CANAIS WHATSAPP / TELEGRAM
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_editorial_extras',
		array(
			'title'       => __( 'Estreias & Canais — Teoria Geek', 'teoriageek' ),
			'description' => __( 'Configure a agenda de Estreias da Semana (cache 30 min) e o convite para os canais oficiais de WhatsApp e Telegram.', 'teoriageek' ),
			'priority'    => 38,
		)
	);

	$wp_customize->add_setting(
		'teoriageek_premieres_list',
		array(
			'default'           => '',
			'sanitize_callback' => 'sanitize_textarea_field',
		)
	);
	$wp_customize->add_control(
		'teoriageek_premieres_list',
		array(
			'label'       => __( 'Estreias da Semana (1 por linha)', 'teoriageek' ),
			'description' => __( 'Formato: Título | Plataforma ou Mídia | Data (ex.: Vingadores: Doutor Destino | Cinemas | 16 Dez). Deixe vazio para ocultar.', 'teoriageek' ),
			'section'     => 'teoriageek_editorial_extras',
			'type'        => 'textarea',
		)
	);

	$wp_customize->add_setting(
		'teoriageek_channel_title',
		array(
			'default'           => 'Entre na Comunidade Teoria Geek',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'teoriageek_channel_title',
		array(
			'label'   => __( 'Título do Bloco de Canais (WhatsApp / Telegram)', 'teoriageek' ),
			'section' => 'teoriageek_editorial_extras',
			'type'    => 'text',
		)
	);

	$wp_customize->add_setting(
		'teoriageek_channel_subtitle',
		array(
			'default'           => 'Receba notícias de games, cinema, séries e críticas direto no celular, sem spam.',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);
	$wp_customize->add_control(
		'teoriageek_channel_subtitle',
		array(
			'label'   => __( 'Descrição do Bloco de Canais', 'teoriageek' ),
			'section' => 'teoriageek_editorial_extras',
			'type'    => 'text',
		)
	);

	$wp_customize->add_setting(
		'teoriageek_channel_whatsapp',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);
	$wp_customize->add_control(
		'teoriageek_channel_whatsapp',
		array(
			'label'   => __( 'Link do Canal WhatsApp (https://whatsapp.com/channel/...)', 'teoriageek' ),
			'section' => 'teoriageek_editorial_extras',
			'type'    => 'url',
		)
	);

	$wp_customize->add_setting(
		'teoriageek_channel_telegram',
		array(
			'default'           => '',
			'sanitize_callback' => 'esc_url_raw',
		)
	);
	$wp_customize->add_control(
		'teoriageek_channel_telegram',
		array(
			'label'   => __( 'Link do Canal Telegram (https://t.me/...)', 'teoriageek' ),
			'section' => 'teoriageek_editorial_extras',
			'type'    => 'url',
		)
	);
}
add_action( 'customize_register', 'teoriageek_customize_register' );

/**
 * Limpa transient de Estreias da Semana quando o Personalizador é salvo.
 */
function teoriageek_flush_premieres_cache() {
	delete_transient( 'teoriageek_weekly_premieres_v1' );
}
add_action( 'customize_save_after', 'teoriageek_flush_premieres_cache' );

/**
 * Monta o CSS dinâmico das variáveis :root (--tg-primary, --tg-accent, --tg-bg, --tg-surface, --tg-text)
 * garantindo texto escuro #0B0F19 sobre fundos amarelos e contraste WCAG 2.1 AA nos modos Claro e Escuro.
 *
 * @return string
 */
function teoriageek_get_customizer_css() {
	$tg_primary = sanitize_hex_color( get_theme_mod( 'teoriageek_color_primary', '#1D4ED8' ) ) ?: '#1D4ED8';
	$tg_accent  = sanitize_hex_color( get_theme_mod( 'teoriageek_color_accent', '#FACC15' ) ) ?: '#FACC15';
	$tg_bg      = sanitize_hex_color( get_theme_mod( 'teoriageek_color_bg', '#FFFFFF' ) ) ?: '#FFFFFF';
	$tg_surface = sanitize_hex_color( get_theme_mod( 'teoriageek_color_surface', '#FFFFFF' ) ) ?: '#FFFFFF';
	$tg_text    = sanitize_hex_color( get_theme_mod( 'teoriageek_color_text', '#0B0F19' ) ) ?: '#0B0F19';

	// Regra inegociável: fundo amarelo de destaque sempre força texto escuro #0B0F19 de alto contraste.
	$tg_on_accent     = '#0B0F19';
	$tg_accent_strong = teoriageek_adjust_hex( $tg_accent, -10 );
	$tg_surface_alt   = ( '#FFFFFF' === strtoupper( $tg_bg ) ) ? '#F4F6F9' : teoriageek_adjust_hex( $tg_bg, -4 );

	// Calibra versão textual de --tg-primary para >= 4.5:1 sobre superfícies claras e escuras.
	$primary_text_light = $tg_primary;
	if ( teoriageek_hex_luminance( $primary_text_light ) > 0.125 ) {
		$primary_text_light = teoriageek_adjust_hex( $primary_text_light, -18 );
	}
	$primary_ink       = teoriageek_contrast_ink( $tg_primary );
	$primary_text_dark = teoriageek_adjust_hex( $tg_primary, 42 );

	return sprintf(
		':root,[data-theme="light"]{'
		. '--tg-primary:%1$s;--tg-accent:%2$s;--tg-accent-strong:%3$s;--tg-on-accent:%4$s;'
		. '--tg-bg:%5$s;--tg-surface:%6$s;--tg-surface-alt:%7$s;--tg-text:%8$s;'
		. '--bg-base:var(--tg-bg);--bg-surface:var(--tg-surface);--bg-surface-alt:var(--tg-surface-alt);--ink-primary:var(--tg-text);'
		. '--accent-brand:%9$s;--fill-brand:var(--tg-primary);--ink-on-fill-brand:%10$s;'
		. '--highlight-comic:var(--tg-accent);--ink-on-highlight:#0B0F19;'
		. '}'
		. '[data-theme="dark"],.dark{'
		. '--tg-primary:%1$s;--tg-accent:%2$s;--tg-accent-strong:%3$s;--tg-on-accent:%4$s;'
		. '--tg-bg:#0B0F19;--tg-surface:#131A2A;--tg-surface-alt:#1B2438;--tg-text:#F1F5F9;'
		. '--bg-base:var(--tg-bg);--bg-surface:var(--tg-surface);--bg-surface-alt:var(--tg-surface-alt);--ink-primary:var(--tg-text);'
		. '--accent-brand:%11$s;--fill-brand:var(--tg-primary);--ink-on-fill-brand:%10$s;'
		. '--highlight-comic:var(--tg-accent);--ink-on-highlight:#0B0F19;'
		. '}',
		esc_attr( $tg_primary ),
		esc_attr( $tg_accent ),
		esc_attr( $tg_accent_strong ),
		esc_attr( $tg_on_accent ),
		esc_attr( $tg_bg ),
		esc_attr( $tg_surface ),
		esc_attr( $tg_surface_alt ),
		esc_attr( $tg_text ),
		esc_attr( $primary_text_light ),
		esc_attr( $primary_ink ),
		esc_attr( $primary_text_dark )
	);
}

/**
 * Injeta dinamicamente as variáveis CSS do Customizer em `wp_head`.
 */
function teoriageek_output_customizer_head_css() {
	$css = teoriageek_get_customizer_css();
	if ( '' !== $css ) {
		echo "\n<style id=\"teoriageek-customizer-vars\">\n" . $css . "\n</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Valores sanitizados com sanitize_hex_color/esc_attr.
	}
}
add_action( 'wp_head', 'teoriageek_output_customizer_head_css', 25 );
