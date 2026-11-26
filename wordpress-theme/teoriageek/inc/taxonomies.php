<?php
/**
 * Teoria Geek — Taxonomia nativa `universo` para páginas de Hub/Dossiê (/universo/...).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra a taxonomia editorial `universo` (hierárquica, compatível com Gutenberg/REST).
 */
function teoriageek_register_universo_taxonomy() {
	$labels = array(
		'name'              => _x( 'Universos (Dossiês)', 'taxonomy general name', 'teoriageek' ),
		'singular_name'     => _x( 'Universo', 'taxonomy singular name', 'teoriageek' ),
		'search_items'      => __( 'Buscar Universos', 'teoriageek' ),
		'all_items'         => __( 'Todos os Universos', 'teoriageek' ),
		'parent_item'       => __( 'Universo Pai', 'teoriageek' ),
		'parent_item_colon' => __( 'Universo Pai:', 'teoriageek' ),
		'edit_item'         => __( 'Editar Universo', 'teoriageek' ),
		'update_item'       => __( 'Atualizar Universo', 'teoriageek' ),
		'add_new_item'      => __( 'Adicionar Novo Universo', 'teoriageek' ),
		'new_item_name'     => __( 'Nome do Novo Universo', 'teoriageek' ),
		'menu_name'         => __( 'Universos', 'teoriageek' ),
	);

	register_taxonomy(
		'universo',
		array( 'post' ),
		array(
			'hierarchical'      => true,
			'labels'            => $labels,
			'show_ui'           => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'query_var'         => true,
			'rewrite'           => array(
				'slug'         => 'universo',
				'with_front'   => false,
				'hierarchical' => true,
			),
		)
	);
}
add_action( 'init', 'teoriageek_register_universo_taxonomy', 5 );
