<?php
/**
 * Teoria Geek — Personalizador do WordPress (Aparência > Personalizar).
 * Painel 100% sem código para logos, paleta da marca, mapeamento de categorias da capa e redes sociais.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Monta lista de opções de categorias reais do banco de dados para os dropdowns do Personalizador.
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
			$choices[ $term->slug ] = sprintf( '%s (%d)', $term->name, (int) $term->count );
		}
	}

	return $choices;
}

/**
 * Registra seções e controles do Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Instância do Personalizador.
 */
function teoriageek_customize_register( $wp_customize ) {
	// =========================================================================
	// 1. IDENTIDADE DO PORTAL (NOME & LOGO MODO ESCURO)
	// =========================================================================
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
			'label'       => __( 'Nome do Portal (Selo textual fallback)', 'teoriageek' ),
			'description' => __( 'Exibido no cabeçalho caso nenhuma logo seja enviada em Identidade do Site.', 'teoriageek' ),
			'section'     => 'title_tagline',
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
				'label'       => __( 'Logo alternativa para cabeçalho escuro (Opcional)', 'teoriageek' ),
				'description' => __( 'Se vazia, o tema utiliza a Logo padrão configurada acima.', 'teoriageek' ),
				'section'     => 'title_tagline',
			)
		)
	);

	// =========================================================================
	// 2. CORES DA MARCA (1 CLIQUE SEM CSS)
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_brand_colors',
		array(
			'title'       => __( 'Teoria Geek — Cores da Marca', 'teoriageek' ),
			'description' => __( 'Ajuste as cores principais do portal com contraste automático acessível (WCAG AA).', 'teoriageek' ),
			'priority'    => 35,
		)
	);

	$wp_customize->add_setting(
		'teoriageek_color_primary',
		array(
			'default'           => '#116EBF',
			'sanitize_callback' => 'sanitize_hex_color',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'teoriageek_color_primary',
			array(
				'label'       => __( 'Cor Primária da Marca (Padrão Teoria Geek: #116EBF)', 'teoriageek' ),
				'section'     => 'teoriageek_brand_colors',
			)
		)
	);

	$wp_customize->add_setting(
		'teoriageek_color_highlight',
		array(
			'default'           => '#FFD600',
			'sanitize_callback' => 'sanitize_hex_color',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'teoriageek_color_highlight',
			array(
				'label'       => __( 'Cor de Destaque / Accent (Botões, Reels, Selos)', 'teoriageek' ),
				'section'     => 'teoriageek_brand_colors',
			)
		)
	);

	$wp_customize->add_setting(
		'teoriageek_color_alert',
		array(
			'default'           => '#BE123C',
			'sanitize_callback' => 'sanitize_hex_color',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'teoriageek_color_alert',
			array(
				'label'       => __( 'Cor de Contraste / Plantão', 'teoriageek' ),
				'section'     => 'teoriageek_brand_colors',
			)
		)
	);

	// =========================================================================
	// 3. MAPEAMENTO DE CATEGORIAS DA CAPA
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_home_categories',
		array(
			'title'       => __( 'Teoria Geek — Categorias da Capa', 'teoriageek' ),
			'description' => __( 'Escolha quais categorias alimentam cada bloco da página inicial. Já pré-configurado para o acervo atual do Teoria Geek.', 'teoriageek' ),
			'priority'    => 36,
		)
	);

	$choices = teoriageek_customizer_category_choices();

	$cat_fields = array(
		'destaque'  => array(
			'label'   => __( 'Categoria de Destaque Principal (Hero)', 'teoriageek' ),
			'default' => 'destaque',
		),
		'noticias'  => array(
			'label'   => __( 'Categoria de Plantão e Giro de Notícias', 'teoriageek' ),
			'default' => 'noticias',
		),
		'criticas'  => array(
			'label'   => __( 'Categoria de Críticas', 'teoriageek' ),
			'default' => 'criticas',
		),
		'reviews'   => array(
			'label'   => __( 'Categoria de Reviews', 'teoriageek' ),
			'default' => 'reviews',
		),
		'especiais' => array(
			'label'   => __( 'Categoria de Especiais & Colunas', 'teoriageek' ),
			'default' => 'especial-teoria-geek',
		),
	);

	foreach ( $cat_fields as $key => $cfg ) {
		$wp_customize->add_setting(
			'teoriageek_cat_' . $key,
			array(
				'default'           => $cfg['default'],
				'sanitize_callback' => 'sanitize_title',
			)
		);
		$wp_customize->add_control(
			'teoriageek_cat_' . $key,
			array(
				'label'   => $cfg['label'],
				'section' => 'teoriageek_home_categories',
				'type'    => 'select',
				'choices' => $choices,
			)
		);
	}

	// =========================================================================
	// 4. REDES SOCIAIS & REELS
	// =========================================================================
	$wp_customize->add_section(
		'teoriageek_socials_and_reels',
		array(
			'title'       => __( 'Teoria Geek — Redes Sociais & Reels', 'teoriageek' ),
			'description' => __( 'Links exibidos na barra superior e rodapé, além do selo gráfico da curtida dupla nos Reels.', 'teoriageek' ),
			'priority'    => 37,
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
			'label'       => __( 'Texto do selo de curtida dupla nos Reels', 'teoriageek' ),
			'description' => __( 'Texto curto Pop-Art exibido ao tocar duas vezes em um Reel (ex.: CURTIU!, TEORIA!, TOP!).', 'teoriageek' ),
			'section'     => 'teoriageek_socials_and_reels',
			'type'        => 'text',
		)
	);
}
add_action( 'customize_register', 'teoriageek_customize_register' );

/**
 * Gera variáveis CSS dinâmicas a partir das cores escolhidas no Personalizador.
 *
 * @return string
 */
function teoriageek_get_customizer_css() {
	$primary   = sanitize_hex_color( get_theme_mod( 'teoriageek_color_primary', '#116EBF' ) ) ?: '#116EBF';
	$highlight = sanitize_hex_color( get_theme_mod( 'teoriageek_color_highlight', '#FFD600' ) ) ?: '#FFD600';
	$alert     = sanitize_hex_color( get_theme_mod( 'teoriageek_color_alert', '#BE123C' ) ) ?: '#BE123C';

	$primary_ink   = teoriageek_contrast_ink( $primary );
	$highlight_ink = teoriageek_contrast_ink( $highlight );
	$alert_ink     = teoriageek_contrast_ink( $alert );
	$primary_dark  = teoriageek_adjust_hex( $primary, 38 );
	$alert_dark    = teoriageek_adjust_hex( $alert, 36 );

	return sprintf(
		':root,[data-theme="light"]{--accent-brand:%1$s;--fill-brand:%1$s;--ink-on-fill-brand:%2$s;--highlight-comic:%3$s;--ink-on-highlight:%4$s;--fill-alert:%5$s;--ink-on-fill-alert:%6$s;}'
		. '[data-theme="dark"],.dark{--accent-brand:%7$s;--fill-brand:%1$s;--ink-on-fill-brand:%2$s;--highlight-comic:%3$s;--ink-on-highlight:%4$s;--fill-alert:%5$s;--ink-on-fill-alert:%6$s;--accent-alert:%8$s;}',
		esc_attr( $primary ),
		esc_attr( $primary_ink ),
		esc_attr( $highlight ),
		esc_attr( $highlight_ink ),
		esc_attr( $alert ),
		esc_attr( $alert_ink ),
		esc_attr( $primary_dark ),
		esc_attr( $alert_dark )
	);
}
