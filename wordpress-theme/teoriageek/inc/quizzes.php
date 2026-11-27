<?php
/**
 * Teoria Geek — Módulo Nativo de Quizzes (Trivia MVP · v2.13.0).
 *
 * Implementa o Custom Post Type `tg_quiz` (Editor Clássico), o construtor administrativo
 * com validação estrita e proteção de versão publicada, limpeza cirúrgica de cache para
 * WP Super Cache (`wp_cache_post_change`), shortcode `[tg_quiz id="123"]`, serialização
 * pública segura (`JSON_HEX_*`) e endpoints REST de contadores atômicos.
 *
 * Nota de arquitetura:
 * - As alternativas corretas (`correct`) são enviadas no JSON embutido no HTML para permitir
 *   execução 100% client-side em páginas estáticas cacheadas pelo WP Super Cache (decisão
 *   intencional para quizzes editoriais de entretenimento).
 * - Os contadores `_tg_quiz_starts_count` e `_tg_quiz_plays_count` são aproximados por
 *   navegador/versão (`localStorage` + rate limit por IP), voltados a prova social e adesão.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra o Custom Post Type `tg_quiz` (/quizzes/<slug>/, Editor Clássico).
 */
function tg_quiz_register_cpt() {
	$labels = array(
		'name'               => _x( 'Quizzes', 'post type general name', 'teoriageek' ),
		'singular_name'      => _x( 'Quiz', 'post type singular name', 'teoriageek' ),
		'menu_name'          => __( 'Quizzes', 'teoriageek' ),
		'name_admin_bar'     => __( 'Quiz', 'teoriageek' ),
		'add_new'            => __( 'Adicionar novo', 'teoriageek' ),
		'add_new_item'       => __( 'Adicionar novo quiz', 'teoriageek' ),
		'new_item'           => __( 'Novo quiz', 'teoriageek' ),
		'edit_item'          => __( 'Editar quiz', 'teoriageek' ),
		'view_item'          => __( 'Ver quiz', 'teoriageek' ),
		'view_items'         => __( 'Ver quizzes', 'teoriageek' ),
		'all_items'          => __( 'Todos os quizzes', 'teoriageek' ),
		'search_items'       => __( 'Buscar quizzes', 'teoriageek' ),
		'not_found'          => __( 'Nenhum quiz encontrado.', 'teoriageek' ),
		'not_found_in_trash' => __( 'Nenhum quiz encontrado na lixeira.', 'teoriageek' ),
	);

	register_post_type(
		'tg_quiz',
		array(
			'labels'              => $labels,
			'public'              => true,
			'show_in_rest'        => false,
			'has_archive'         => false,
			'exclude_from_search' => true,
			'menu_icon'           => 'dashicons-editor-help',
			'menu_position'       => 6,
			'rewrite'             => array(
				'slug'       => 'quizzes',
				'with_front' => false,
			),
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'author' ),
			'taxonomies'          => array( 'category', 'universo' ),
		)
	);

	if ( taxonomy_exists( 'universo' ) ) {
		register_taxonomy_for_object_type( 'universo', 'tg_quiz' );
	}
	register_taxonomy_for_object_type( 'category', 'tg_quiz' );
}
add_action( 'init', 'tg_quiz_register_cpt', 10 );

/**
 * Garante Editor Clássico para `tg_quiz` mesmo se filtros globais tentarem forçar Gutenberg.
 *
 * @param bool   $use_block_editor Estado atual.
 * @param string $post_type        Tipo de post.
 * @return bool
 */
function tg_quiz_disable_block_editor( $use_block_editor, $post_type ) {
	if ( 'tg_quiz' === $post_type ) {
		return false;
	}
	return $use_block_editor;
}
add_filter( 'use_block_editor_for_post_type', 'tg_quiz_disable_block_editor', 10, 2 );

/**
 * Atualiza rewrite rules uma única vez por versão sem exigir salvamento manual de Permalinks.
 */
function tg_quiz_maybe_flush_rewrites() {
	if ( get_option( 'tg_quiz_rewrite_ver' ) !== TEORIAGEEK_VERSION ) {
		flush_rewrite_rules( false );
		update_option( 'tg_quiz_rewrite_ver', TEORIAGEEK_VERSION, true );
	}
}
add_action( 'init', 'tg_quiz_maybe_flush_rewrites', 99 );

/**
 * Lê um post_meta JSON protegido tratando falha de decode ou vazio como array vazio.
 *
 * @param int    $post_id  ID do quiz.
 * @param string $meta_key Chave do metadado.
 * @return array<int, array<string, mixed>>
 */
function tg_quiz_read_json_meta( $post_id, $meta_key ) {
	$raw = (string) get_post_meta( (int) $post_id, $meta_key, true );
	if ( '' === $raw ) {
		return array();
	}
	$decoded = json_decode( $raw, true );
	return is_array( $decoded ) ? $decoded : array();
}

/**
 * Grava um array em post_meta JSON protegido usando wp_slash + JSON_UNESCAPED_UNICODE.
 *
 * @param int                 $post_id  ID do quiz.
 * @param string              $meta_key Chave do metadado.
 * @param array<mixed, mixed> $data     Estrutura serializável.
 */
function tg_quiz_write_json_meta( $post_id, $meta_key, array $data ) {
	$json = wp_json_encode( $data, JSON_UNESCAPED_UNICODE );
	if ( false === $json ) {
		$json = '[]';
	}
	update_post_meta( (int) $post_id, $meta_key, wp_slash( $json ) );
}

/**
 * Armazena ou consulta a flag `pending_edit` no ciclo da requisição atual.
 *
 * @param int       $post_id ID do post.
 * @param bool|null $set     Se informado, define o estado.
 * @return bool
 */
function tg_quiz_request_pending_edit( $post_id, $set = null ) {
	static $flags = array();
	$pid          = (int) $post_id;
	if ( null !== $set ) {
		$flags[ $pid ] = (bool) $set;
	}
	return ! empty( $flags[ $pid ] );
}

/**
 * Verifica todas as guardas obrigatórias antes de interceptar salvamento do `tg_quiz`.
 *
 * @param string $post_type Tipo de post avaliado.
 * @param int    $post_id   ID do post (0 se novo).
 * @return bool True se deve processar o builder do quiz.
 */
function tg_quiz_passes_save_guards( $post_type, $post_id ) {
	if ( 'tg_quiz' !== $post_type ) {
		return false;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return false;
	}
	if ( $post_id > 0 && ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) ) {
		return false;
	}
	if ( wp_doing_ajax() ) {
		return false;
	}
	if ( isset( $_REQUEST['bulk_edit'] ) || isset( $_GET['bulk_edit'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return false;
	}
	if ( empty( $_POST['tg_quiz_nonce'] ) ) {
		return false;
	}
	$nonce = sanitize_text_field( wp_unslash( $_POST['tg_quiz_nonce'] ) );
	if ( ! wp_verify_nonce( $nonce, 'tg_quiz_save_builder' ) ) {
		return false;
	}
	if ( $post_id > 0 ) {
		return current_user_can( 'edit_post', $post_id );
	}
	return current_user_can( 'edit_posts' );
}

/**
 * Coleta, sanitiza e valida o payload de `$_POST['tg_quiz']`, memoizado por requisição.
 *
 * @param int $post_id ID do quiz sendo salvo.
 * @return array{questions:array<int,array<string,mixed>>,results:array<int,array<string,mixed>>,errors:string[]}|null
 */
function tg_quiz_collect_payload( $post_id ) {
	static $memo = array();
	$pid         = (int) $post_id;

	if ( array_key_exists( $pid, $memo ) ) {
		return $memo[ $pid ];
	}

	if ( ! tg_quiz_passes_save_guards( 'tg_quiz', $pid ) ) {
		$memo[ $pid ] = null;
		return null;
	}

	$raw_root  = isset( $_POST['tg_quiz'] ) && is_array( $_POST['tg_quiz'] ) ? wp_unslash( $_POST['tg_quiz'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$raw_qs    = isset( $raw_root['questions'] ) && is_array( $raw_root['questions'] ) ? array_values( $raw_root['questions'] ) : array();
	$raw_res   = isset( $raw_root['results'] ) && is_array( $raw_root['results'] ) ? array_values( $raw_root['results'] ) : array();

	$questions = array();
	$results   = array();
	$errors    = array();

	$q_count = count( $raw_qs );
	if ( $q_count < 3 || $q_count > 15 ) {
		$errors[] = sprintf(
			/* translators: %d: quantidade atual de perguntas */
			__( 'O quiz deve ter entre 3 e 15 perguntas (atual: %d).', 'teoriageek' ),
			$q_count
		);
	}

	foreach ( array_slice( $raw_qs, 0, 25 ) as $qi => $rq ) {
		if ( ! is_array( $rq ) ) {
			continue;
		}
		$q_num       = $qi + 1;
		$text        = isset( $rq['text'] ) ? trim( sanitize_text_field( (string) $rq['text'] ) ) : '';
		$explanation = isset( $rq['explanation'] ) ? trim( sanitize_textarea_field( (string) $rq['explanation'] ) ) : '';
		$image_id    = isset( $rq['image_id'] ) ? absint( $rq['image_id'] ) : 0;
		if ( $image_id > 0 && ! wp_attachment_is_image( $image_id ) ) {
			$image_id = 0;
		}

		$text_len = mb_strlen( $text, 'UTF-8' );
		if ( $text_len < 1 ) {
			$errors[] = sprintf( __( 'Pergunta %d: preencha o texto da pergunta.', 'teoriageek' ), $q_num );
		} elseif ( $text_len > 200 ) {
			$errors[] = sprintf( __( 'Pergunta %1$d: o texto deve ter no máximo 200 caracteres (atual: %2$d).', 'teoriageek' ), $q_num, $text_len );
		}

		$exp_len = mb_strlen( $explanation, 'UTF-8' );
		if ( $exp_len > 300 ) {
			$errors[] = sprintf( __( 'Pergunta %1$d: a explicação deve ter no máximo 300 caracteres (atual: %2$d).', 'teoriageek' ), $q_num, $exp_len );
		}

		$raw_opts = isset( $rq['options'] ) && is_array( $rq['options'] ) ? array_values( $rq['options'] ) : array();
		$opt_cnt  = count( $raw_opts );
		if ( $opt_cnt < 2 || $opt_cnt > 5 ) {
			$errors[] = sprintf( __( 'Pergunta %1$d: informe entre 2 e 5 alternativas (atual: %2$d).', 'teoriageek' ), $q_num, $opt_cnt );
		}

		$options = array();
		foreach ( array_slice( $raw_opts, 0, 10 ) as $oi => $ro ) {
			$o_num = $oi + 1;
			$label = '';
			if ( is_array( $ro ) && isset( $ro['label'] ) ) {
				$label = trim( sanitize_text_field( (string) $ro['label'] ) );
			} elseif ( is_scalar( $ro ) ) {
				$label = trim( sanitize_text_field( (string) $ro ) );
			}
			$lbl_len = mb_strlen( $label, 'UTF-8' );
			if ( $lbl_len < 1 ) {
				$errors[] = sprintf( __( 'Pergunta %1$d, alternativa %2$d: preencha o texto da alternativa.', 'teoriageek' ), $q_num, $o_num );
			} elseif ( $lbl_len > 120 ) {
				$errors[] = sprintf( __( 'Pergunta %1$d, alternativa %2$d: o texto excede 120 caracteres (atual: %3$d).', 'teoriageek' ), $q_num, $o_num, $lbl_len );
			}
			$options[] = array(
				'label' => mb_substr( $label, 0, 500, 'UTF-8' ),
			);
		}

		$raw_correct = isset( $rq['correct'] ) ? trim( (string) $rq['correct'] ) : '';
		$correct_idx = -1;
		if ( '' !== $raw_correct && preg_match( '/^\d+$/', $raw_correct ) ) {
			$cand = (int) $raw_correct;
			if ( $cand >= 0 && $cand < count( $options ) ) {
				$correct_idx = $cand;
			}
		}
		if ( $correct_idx < 0 ) {
			$errors[] = sprintf( __( 'Pergunta %d: marque a alternativa correta.', 'teoriageek' ), $q_num );
		}

		$questions[] = array(
			'text'        => mb_substr( $text, 0, 500, 'UTF-8' ),
			'image_id'    => $image_id,
			'explanation' => mb_substr( $explanation, 0, 800, 'UTF-8' ),
			'options'     => $options,
			'correct'     => $correct_idx,
		);
	}

	$r_count = count( $raw_res );
	if ( $r_count < 1 || $r_count > 6 ) {
		$errors[] = sprintf(
			/* translators: %d: quantidade atual de faixas */
			__( 'Faixas de resultado: informe entre 1 e 6 faixas (atual: %d).', 'teoriageek' ),
			$r_count
		);
	}

	$has_zero_pct = false;
	$seen_pcts    = array();

	foreach ( array_slice( $raw_res, 0, 12 ) as $ri => $rr ) {
		if ( ! is_array( $rr ) ) {
			continue;
		}
		$r_num    = $ri + 1;
		$raw_min  = isset( $rr['min_pct'] ) ? trim( (string) $rr['min_pct'] ) : '';
		$min_pct  = -1;
		if ( '' !== $raw_min && preg_match( '/^-?\d+$/', $raw_min ) ) {
			$val = (int) $raw_min;
			if ( $val >= 0 && $val <= 100 ) {
				$min_pct = $val;
			}
		}
		if ( $min_pct < 0 ) {
			$errors[] = sprintf( __( 'Faixa de resultado %d: informe uma porcentagem mínima inteira entre 0 e 100.', 'teoriageek' ), $r_num );
			$min_pct  = 0;
		} else {
			if ( 0 === $min_pct ) {
				$has_zero_pct = true;
			}
			if ( in_array( $min_pct, $seen_pcts, true ) ) {
				$errors[] = sprintf( __( 'Faixa de resultado %1$d: a porcentagem mínima %2$d%% está duplicada.', 'teoriageek' ), $r_num, $min_pct );
			}
			$seen_pcts[] = $min_pct;
		}

		$r_title = isset( $rr['title'] ) ? trim( sanitize_text_field( (string) $rr['title'] ) ) : '';
		$r_desc  = isset( $rr['description'] ) ? trim( sanitize_textarea_field( (string) $rr['description'] ) ) : '';
		$r_img   = isset( $rr['image_id'] ) ? absint( $rr['image_id'] ) : 0;
		if ( $r_img > 0 && ! wp_attachment_is_image( $r_img ) ) {
			$r_img = 0;
		}

		$rt_len = mb_strlen( $r_title, 'UTF-8' );
		if ( $rt_len < 1 ) {
			$errors[] = sprintf( __( 'Faixa de resultado %d: preencha o título da faixa.', 'teoriageek' ), $r_num );
		} elseif ( $rt_len > 80 ) {
			$errors[] = sprintf( __( 'Faixa de resultado %1$d: o título deve ter no máximo 80 caracteres (atual: %2$d).', 'teoriageek' ), $r_num, $rt_len );
		}

		$rd_len = mb_strlen( $r_desc, 'UTF-8' );
		if ( $rd_len > 400 ) {
			$errors[] = sprintf( __( 'Faixa de resultado %1$d: a descrição deve ter no máximo 400 caracteres (atual: %2$d).', 'teoriageek' ), $r_num, $rd_len );
		}

		$results[] = array(
			'min_pct'     => max( 0, min( 100, $min_pct ) ),
			'title'       => mb_substr( $r_title, 0, 300, 'UTF-8' ),
			'description' => mb_substr( $r_desc, 0, 1000, 'UTF-8' ),
			'image_id'    => $r_img,
		);
	}

	if ( $r_count >= 1 && ! $has_zero_pct ) {
		$errors[] = __( 'Faixas de resultado: cadastre pelo menos 1 faixa começando em 0%.', 'teoriageek' );
	}

	$memo[ $pid ] = array(
		'questions' => $questions,
		'results'   => $results,
		'errors'    => $errors,
	);
	return $memo[ $pid ];
}

/**
 * Intercepta `wp_insert_post_data` (prioridade 99) para impedir publicação inválida:
 * - Se não estava publicado antes: rebaixa para `draft`.
 * - Se já estava `publish`: mantém no ar intacto e sinaliza `pending_edit = true`.
 *
 * @param array<string, mixed> $data    Dados sanitizados para wp_posts.
 * @param array<string, mixed> $postarr Dados brutos do post.
 * @return array<string, mixed>
 */
function tg_quiz_filter_insert_post_data( $data, $postarr ) {
	$post_type = isset( $data['post_type'] ) ? (string) $data['post_type'] : '';
	$post_id   = ! empty( $postarr['ID'] ) ? (int) $postarr['ID'] : 0;

	if ( ! tg_quiz_passes_save_guards( $post_type, $post_id ) ) {
		return $data;
	}

	$target_status = isset( $data['post_status'] ) ? (string) $data['post_status'] : '';
	if ( ! in_array( $target_status, array( 'publish', 'future' ), true ) ) {
		return $data;
	}

	$payload = tg_quiz_collect_payload( $post_id );
	if ( ! is_array( $payload ) || empty( $payload['errors'] ) ) {
		return $data;
	}

	$existing      = ( $post_id > 0 ) ? get_post( $post_id ) : null;
	$was_published = ( $existing instanceof WP_Post && 'publish' === $existing->post_status );

	if ( $was_published ) {
		// Mantém o quiz no ar exatamente como estava (sem 404 nem mudança na versão pública).
		$data['post_status']       = 'publish';
		$data['post_modified']     = $existing->post_modified;
		$data['post_modified_gmt'] = $existing->post_modified_gmt;
		tg_quiz_request_pending_edit( $post_id, true );
	} else {
		$data['post_status'] = 'draft';
	}

	return $data;
}
add_filter( 'wp_insert_post_data', 'tg_quiz_filter_insert_post_data', 99, 2 );

/**
 * Persiste metas ou armazena edição pendente em transient quando há erros de validação.
 *
 * @param int     $post_id ID do quiz.
 * @param WP_Post $post    Objeto do post salvo.
 */
function tg_quiz_save_post( $post_id, $post ) {
	if ( ! $post instanceof WP_Post || ! tg_quiz_passes_save_guards( $post->post_type, (int) $post_id ) ) {
		return;
	}

	$payload = tg_quiz_collect_payload( (int) $post_id );
	if ( ! is_array( $payload ) ) {
		return;
	}

	$user_id     = (int) get_current_user_id();
	$pending_key = 'tg_quiz_pending_' . (int) $post_id . '_' . $user_id;
	$err_key     = 'tg_quiz_val_err_' . $user_id;

	if ( empty( $payload['errors'] ) ) {
		update_post_meta( $post_id, '_tg_quiz_type', 'trivia' );
		tg_quiz_write_json_meta( $post_id, '_tg_quiz_questions', $payload['questions'] );
		tg_quiz_write_json_meta( $post_id, '_tg_quiz_results', $payload['results'] );
		add_post_meta( $post_id, '_tg_quiz_starts_count', 0, true );
		add_post_meta( $post_id, '_tg_quiz_plays_count', 0, true );
		delete_transient( $pending_key );
		delete_transient( $err_key );
		return;
	}

	set_transient( $err_key, $payload['errors'], 60 );

	if ( tg_quiz_request_pending_edit( (int) $post_id ) ) {
		// Quiz já publicado: NÃO sobrescreve o JSON válido no ar; guarda rascunho da edição por 1h.
		set_transient(
			$pending_key,
			array(
				'questions' => $payload['questions'],
				'results'   => $payload['results'],
			),
			HOUR_IN_SECONDS
		);
		return;
	}

	// Quiz em rascunho: persiste metas mesmo incompletas para não perder o trabalho em construção.
	update_post_meta( $post_id, '_tg_quiz_type', 'trivia' );
	tg_quiz_write_json_meta( $post_id, '_tg_quiz_questions', $payload['questions'] );
	tg_quiz_write_json_meta( $post_id, '_tg_quiz_results', $payload['results'] );
	add_post_meta( $post_id, '_tg_quiz_starts_count', 0, true );
	add_post_meta( $post_id, '_tg_quiz_plays_count', 0, true );
	delete_transient( $pending_key );
}
add_action( 'save_post_tg_quiz', 'tg_quiz_save_post', 10, 2 );

/**
 * Suprime o aviso padrão enganoso "Post publicado" quando o salvamento teve erros de validação.
 *
 * @param string $location URL de redirecionamento pós-save.
 * @return string
 */
function tg_quiz_filter_redirect_post_location( $location ) {
	$user_id = (int) get_current_user_id();
	if ( $user_id > 0 && false !== get_transient( 'tg_quiz_val_err_' . $user_id ) ) {
		$location = remove_query_arg( 'message', $location );
	}
	return $location;
}
add_filter( 'redirect_post_location', 'tg_quiz_filter_redirect_post_location', 20 );

/**
 * Exibe e consome o transient de erros de validação exclusivamente na tela de edição do `tg_quiz`.
 */
function tg_quiz_render_admin_validation_notices() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || 'tg_quiz' !== $screen->post_type || 'post' !== $screen->base ) {
		return;
	}
	$user_id = (int) get_current_user_id();
	if ( $user_id <= 0 ) {
		return;
	}
	$errors = get_transient( 'tg_quiz_val_err_' . $user_id );
	if ( ! is_array( $errors ) || empty( $errors ) ) {
		return;
	}
	delete_transient( 'tg_quiz_val_err_' . $user_id );
	?>
	<div class="notice notice-error is-dismissible">
		<p><strong><?php esc_html_e( 'Verifique os campos obrigatórios do Quiz:', 'teoriageek' ); ?></strong></p>
		<ul style="list-style:disc;margin:4px 0 6px 20px;">
			<?php foreach ( $errors as $err_msg ) : ?>
				<li><?php echo esc_html( (string) $err_msg ); ?></li>
			<?php endforeach; ?>
		</ul>
	</div>
	<?php
}
add_action( 'admin_notices', 'tg_quiz_render_admin_validation_notices' );

/**
 * Limpeza cirúrgica de cache (WP Super Cache) para o próprio quiz e até 100 posts/páginas
 * publicados que incorporem `[tg_quiz id="{quiz_id}"]`. Jamais chama `wp_cache_clear_cache()`.
 *
 * @param int $quiz_id ID do quiz modificado.
 */
function tg_quiz_purge_cache( $quiz_id ) {
	$qid = absint( $quiz_id );
	if ( $qid <= 0 || ! function_exists( 'wp_cache_post_change' ) ) {
		return;
	}

	wp_cache_post_change( $qid );

	global $wpdb;
	$like = '%' . $wpdb->esc_like( '[tg_quiz' ) . '%';
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT ID, post_content
			 FROM {$wpdb->posts}
			 WHERE post_type IN ('post', 'page')
			   AND post_status = 'publish'
			   AND post_content LIKE %s
			 ORDER BY ID DESC
			 LIMIT 100",
			$like
		)
	);

	if ( ! is_array( $rows ) || empty( $rows ) ) {
		return;
	}

	$regex = '/\[tg_quiz\b[^\]]*\bid\s*=\s*(?:"' . $qid . '"|\'' . $qid . '\'|' . $qid . '(?![0-9]))[^\]]*\]/i';
	foreach ( $rows as $row ) {
		if ( isset( $row->ID, $row->post_content ) && 1 === preg_match( $regex, (string) $row->post_content ) ) {
			wp_cache_post_change( (int) $row->ID );
		}
	}
}

/**
 * Dispara limpeza cirúrgica em `save_post_tg_quiz` (prioridade 20) quando publicado sem erros pendentes.
 *
 * @param int     $post_id ID do quiz.
 * @param WP_Post $post    Objeto do quiz.
 */
function tg_quiz_purge_on_save( $post_id, $post ) {
	if ( ! $post instanceof WP_Post || 'tg_quiz' !== $post->post_type ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( 'publish' !== $post->post_status || tg_quiz_request_pending_edit( (int) $post_id ) ) {
		return;
	}
	tg_quiz_purge_cache( (int) $post_id );
}
add_action( 'save_post_tg_quiz', 'tg_quiz_purge_on_save', 20, 2 );

/**
 * Dispara limpeza cirúrgica quando um `tg_quiz` deixa de ser `publish` (rascunho, lixeira, privado).
 *
 * @param string  $new_status Novo status.
 * @param string  $old_status Status anterior.
 * @param WP_Post $post       Objeto do post.
 */
function tg_quiz_purge_on_unpublish( $new_status, $old_status, $post ) {
	if ( $post instanceof WP_Post && 'tg_quiz' === $post->post_type && 'publish' === $old_status && 'publish' !== $new_status ) {
		tg_quiz_purge_cache( (int) $post->ID );
	}
}
add_action( 'transition_post_status', 'tg_quiz_purge_on_unpublish', 10, 3 );

/**
 * Registra os meta boxes nativos do construtor de Quizzes no `/wp-admin/`.
 */
function tg_quiz_register_meta_boxes() {
	add_meta_box(
		'tg_quiz_config_box',
		__( 'Configuração e shortcode', 'teoriageek' ),
		'tg_quiz_render_config_meta_box',
		'tg_quiz',
		'side',
		'high'
	);

	add_meta_box(
		'tg_quiz_results_box',
		__( 'Faixas de resultado', 'teoriageek' ),
		'tg_quiz_render_results_meta_box',
		'tg_quiz',
		'normal',
		'high'
	);

	add_meta_box(
		'tg_quiz_questions_box',
		__( 'Perguntas e alternativas', 'teoriageek' ),
		'tg_quiz_render_questions_meta_box',
		'tg_quiz',
		'normal',
		'high'
	);

	if ( current_user_can( 'manage_options' ) ) {
		add_meta_box(
			'tg_quiz_diag_box',
			__( 'Diagnóstico do servidor', 'teoriageek' ),
			'tg_quiz_render_diag_meta_box',
			'tg_quiz',
			'side',
			'low'
		);
	}
}
add_action( 'add_meta_boxes_tg_quiz', 'tg_quiz_register_meta_boxes' );

/**
 * Enfileira `wp_enqueue_media()` e `assets/js/quiz-admin.js` apenas em `post.php` e `post-new.php` de `tg_quiz`.
 *
 * @param string $hook_suffix Tela atual do admin.
 */
function tg_quiz_enqueue_admin_assets( $hook_suffix ) {
	if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
		return;
	}
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || 'tg_quiz' !== $screen->post_type ) {
		return;
	}

	wp_enqueue_media();

	$js_path = TEORIAGEEK_DIR . '/assets/js/quiz-admin.js';
	if ( file_exists( $js_path ) ) {
		wp_enqueue_script(
			'teoriageek-quiz-admin',
			TEORIAGEEK_URI . '/assets/js/quiz-admin.js',
			array(),
			(string) filemtime( $js_path ),
			true
		);
	}
}
add_action( 'admin_enqueue_scripts', 'tg_quiz_enqueue_admin_assets' );

/**
 * Obtém o estado do builder para o formulário de edição (priorizando transient `tg_quiz_pending_*`).
 *
 * @param WP_Post $post Post atual.
 * @return array{questions:array<int,array<string,mixed>>,results:array<int,array<string,mixed>>,is_pending:bool}
 */
function tg_quiz_get_editor_state( $post ) {
	static $cache = array();
	$pid          = (int) $post->ID;
	if ( isset( $cache[ $pid ] ) ) {
		return $cache[ $pid ];
	}

	$user_id     = (int) get_current_user_id();
	$pending_key = 'tg_quiz_pending_' . $pid . '_' . $user_id;
	$pending     = ( $pid > 0 && $user_id > 0 ) ? get_transient( $pending_key ) : false;

	if ( is_array( $pending ) && ( isset( $pending['questions'] ) || isset( $pending['results'] ) ) ) {
		$cache[ $pid ] = array(
			'questions'  => isset( $pending['questions'] ) && is_array( $pending['questions'] ) ? $pending['questions'] : array(),
			'results'    => isset( $pending['results'] ) && is_array( $pending['results'] ) ? $pending['results'] : array(),
			'is_pending' => true,
		);
		return $cache[ $pid ];
	}

	$questions = tg_quiz_read_json_meta( $pid, '_tg_quiz_questions' );
	$results   = tg_quiz_read_json_meta( $pid, '_tg_quiz_results' );

	// Em novo quiz ainda vazio, pré-cria estrutura inicial mínima (3 perguntas e 1 faixa 0%).
	if ( 'auto-draft' === $post->post_status && empty( $questions ) && empty( $results ) ) {
		for ( $i = 0; $i < 3; $i++ ) {
			$questions[] = array(
				'text'        => '',
				'image_id'    => 0,
				'explanation' => '',
				'options'     => array(
					array( 'label' => '' ),
					array( 'label' => '' ),
					array( 'label' => '' ),
				),
				'correct'     => -1,
			);
		}
		$results[] = array(
			'min_pct'     => 0,
			'title'       => '',
			'description' => '',
			'image_id'    => 0,
		);
	}

	$cache[ $pid ] = array(
		'questions'  => $questions,
		'results'    => $results,
		'is_pending' => false,
	);
	return $cache[ $pid ];
}

/**
 * Meta Box 1 (lateral): Configuração, shortcode, dica recomendada e métricas.
 *
 * @param WP_Post $post Quiz atual.
 */
function tg_quiz_render_config_meta_box( $post ) {
	wp_nonce_field( 'tg_quiz_save_builder', 'tg_quiz_nonce' );

	$pid        = (int) $post->ID;
	$is_saved   = ( $pid > 0 && 'auto-draft' !== $post->post_status );
	$shortcode  = sprintf( '[tg_quiz id="%d"]', $pid );
	$starts     = max( 0, (int) get_post_meta( $pid, '_tg_quiz_starts_count', true ) );
	$plays      = max( 0, (int) get_post_meta( $pid, '_tg_quiz_plays_count', true ) );
	$rate_label = $starts > 0 ? number_format_i18n( min( 100, ( $plays / $starts ) * 100 ), 1 ) . '%' : '—';
	$state      = tg_quiz_get_editor_state( $post );
	$q_total    = count( $state['questions'] );
	?>
	<style>
		.tgq-adm-field { margin-bottom: 12px; }
		.tgq-adm-label { display: block; font-weight: 600; margin-bottom: 4px; font-size: 12px; }
		.tgq-adm-copy-row { display: flex; gap: 6px; align-items: center; }
		.tgq-adm-copy-row input { flex: 1; font-family: monospace; font-size: 12px; }
		.tgq-adm-hint { padding: 8px 10px; border-radius: 4px; background: #f0f6fc; border-left: 3px solid #0073e6; font-size: 12px; color: #1d2327; margin: 10px 0; }
		.tgq-adm-qcount { padding: 7px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 10px; border: 1px solid #c3c4c7; background: #f6f7f7; }
		.tgq-adm-qcount.is-warn { background: #fcf9e8; border-color: #dba617; color: #684c00; }
		.tgq-adm-qcount.is-ok { background: #edfaef; border-color: #00a32a; color: #0a5c1e; }
		.tgq-adm-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; border-top: 1px solid #dcdcde; padding-top: 10px; text-align: center; }
		.tgq-adm-stat { background: #f6f7f7; border: 1px solid #dcdcde; border-radius: 4px; padding: 6px 4px; }
		.tgq-adm-stat strong { display: block; font-size: 15px; color: #1d2327; }
		.tgq-adm-stat span { font-size: 11px; color: #50575e; }
		.tgq-pending-banner { margin: 0 0 14px; padding: 10px 12px; border-radius: 4px; border-left: 4px solid #d63638; background: #fcf0f1; color: #1d2327; font-weight: 600; }
		.tgq-card { background: #f8f9fa; border: 1px solid #c3c4c7; border-radius: 6px; padding: 12px 14px; margin-bottom: 12px; }
		.tgq-card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #dcdcde; }
		.tgq-card-title { font-size: 13px; font-weight: 700; color: #1d2327; margin: 0; }
		.tgq-btn-group { display: inline-flex; gap: 4px; align-items: center; }
		.tgq-grid-row { display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin-bottom: 10px; }
		@media (max-width: 782px) { .tgq-grid-row { grid-template-columns: 1fr; } }
		.tgq-opt-list { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }
		.tgq-opt-row { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #dcdcde; border-radius: 4px; padding: 6px 8px; }
		.tgq-opt-row input[type="text"] { flex: 1; min-width: 0; }
		.tgq-media-box { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; }
		.tgq-media-thumb { width: 64px; height: 42px; object-fit: cover; border-radius: 3px; border: 1px solid #c3c4c7; background: #fff; }
	</style>

	<div class="tgq-adm-field">
		<span class="tgq-adm-label"><?php esc_html_e( 'Formato', 'teoriageek' ); ?></span>
		<span><?php esc_html_e( 'Trivia (acerto e pontuação)', 'teoriageek' ); ?></span>
	</div>

	<div class="tgq-adm-field">
		<label class="tgq-adm-label" for="tg-quiz-shortcode-input"><?php esc_html_e( 'Shortcode para incorporar em matérias', 'teoriageek' ); ?></label>
		<?php if ( $is_saved ) : ?>
			<div class="tgq-adm-copy-row">
				<input type="text" id="tg-quiz-shortcode-input" readonly value="<?php echo esc_attr( $shortcode ); ?>" onclick="this.select();" />
				<button type="button" class="button button-secondary" data-tgq-copy-shortcode="<?php echo esc_attr( $shortcode ); ?>">
					<?php esc_html_e( 'Copiar', 'teoriageek' ); ?>
				</button>
			</div>
		<?php else : ?>
			<p class="description"><?php esc_html_e( 'Salve como rascunho ou publique o quiz para gerar o shortcode.', 'teoriageek' ); ?></p>
		<?php endif; ?>
	</div>

	<div class="tgq-adm-hint">
		<?php esc_html_e( 'Recomendado: 5 a 8 perguntas com 3 a 4 alternativas', 'teoriageek' ); ?>
	</div>

	<div id="tgq-question-counter-box" class="tgq-adm-qcount <?php echo ( $q_total >= 5 && $q_total <= 8 ) ? 'is-ok' : 'is-warn'; ?>">
		<span id="tgq-question-counter-text">
			<?php
			echo esc_html(
				sprintf(
					/* translators: %d: total atual de perguntas */
					__( 'Perguntas cadastradas: %d de 15', 'teoriageek' ),
					$q_total
				)
			);
			?>
		</span>
		<span id="tgq-question-counter-warn" style="display:block;font-weight:400;margin-top:2px;">
			<?php
			if ( $q_total < 3 ) {
				esc_html_e( 'Abaixo do mínimo obrigatório (3 perguntas).', 'teoriageek' );
			} elseif ( $q_total < 5 || $q_total > 8 ) {
				esc_html_e( 'Fora da faixa recomendada de 5 a 8 perguntas.', 'teoriageek' );
			} else {
				esc_html_e( 'Quantidade ideal para retenção.', 'teoriageek' );
			}
			?>
		</span>
	</div>

	<div class="tgq-adm-stats" aria-label="<?php esc_attr_e( 'Métricas aproximadas do quiz', 'teoriageek' ); ?>">
		<div class="tgq-adm-stat">
			<strong><?php echo esc_html( number_format_i18n( $starts ) ); ?></strong>
			<span><?php esc_html_e( 'Iniciados', 'teoriageek' ); ?></span>
		</div>
		<div class="tgq-adm-stat">
			<strong><?php echo esc_html( number_format_i18n( $plays ) ); ?></strong>
			<span><?php esc_html_e( 'Concluídos', 'teoriageek' ); ?></span>
		</div>
		<div class="tgq-adm-stat">
			<strong><?php echo esc_html( $rate_label ); ?></strong>
			<span><?php esc_html_e( 'Conclusão', 'teoriageek' ); ?></span>
		</div>
	</div>
	<?php
}

/**
 * Renderiza seletor de imagem opcional (wp.media) reutilizável para perguntas e faixas de resultado.
 *
 * @param string $input_name Atributo `name` do campo hidden.
 * @param int    $image_id   ID do anexo atual.
 */
function tg_quiz_render_media_picker_field( $input_name, $image_id ) {
	$img_id    = absint( $image_id );
	$thumb_url = ( $img_id > 0 && wp_attachment_is_image( $img_id ) ) ? (string) wp_get_attachment_image_url( $img_id, 'thumbnail' ) : '';
	?>
	<div class="tgq-media-box" data-tgq-media>
		<input type="hidden" data-tgq-field="image_id" name="<?php echo esc_attr( $input_name ); ?>" value="<?php echo esc_attr( $img_id > 0 ? (string) $img_id : '0' ); ?>" />
		<img
			src="<?php echo esc_url( $thumb_url ); ?>"
			alt=""
			class="tgq-media-thumb"
			data-tgq-media-preview
			<?php echo '' === $thumb_url ? 'hidden' : ''; ?>
		/>
		<button type="button" class="button button-small" data-tgq-media-select>
			<?php esc_html_e( 'Selecionar imagem', 'teoriageek' ); ?>
		</button>
		<button type="button" class="button-link-delete" data-tgq-media-remove <?php echo '' === $thumb_url ? 'hidden' : ''; ?>>
			<?php esc_html_e( 'Remover imagem', 'teoriageek' ); ?>
		</button>
	</div>
	<?php
}

/**
 * Meta Box 2: Faixas de resultado (1 a 6 faixas, mínimo 1 com min_pct = 0).
 *
 * @param WP_Post $post Quiz atual.
 */
function tg_quiz_render_results_meta_box( $post ) {
	$state   = tg_quiz_get_editor_state( $post );
	$results = $state['results'];
	?>
	<?php if ( $state['is_pending'] ) : ?>
		<div class="tgq-pending-banner" role="alert">
			<?php esc_html_e( 'Esta edição NÃO foi publicada: corrija os erros abaixo. A versão que está no ar não mudou.', 'teoriageek' ); ?>
		</div>
	<?php endif; ?>

	<p class="description" style="margin-bottom:10px;">
		<?php esc_html_e( 'Cadastre de 1 a 6 faixas de pontuação (0% a 100%). É obrigatório existir pelo menos uma faixa com 0% (sem porcentagens repetidas).', 'teoriageek' ); ?>
	</p>

	<div id="tgq-results-list">
		<?php foreach ( $results as $ri => $band ) : ?>
			<?php
			$min_pct = isset( $band['min_pct'] ) ? (int) $band['min_pct'] : 0;
			$title   = isset( $band['title'] ) ? (string) $band['title'] : '';
			$desc    = isset( $band['description'] ) ? (string) $band['description'] : '';
			$img_id  = isset( $band['image_id'] ) ? absint( $band['image_id'] ) : 0;
			?>
			<div class="tgq-card" data-tgq-result>
				<div class="tgq-card-head">
					<h4 class="tgq-card-title" data-tgq-result-heading><?php echo esc_html( sprintf( __( 'Faixa #%d', 'teoriageek' ), $ri + 1 ) ); ?></h4>
					<button type="button" class="button-link-delete" data-tgq-remove-result><?php esc_html_e( 'Remover faixa', 'teoriageek' ); ?></button>
				</div>
				<div class="tgq-grid-row">
					<div>
						<label class="tgq-adm-label"><?php esc_html_e( '% Mínima (0–100)', 'teoriageek' ); ?></label>
						<input type="number" min="0" max="100" step="1" class="widefat" data-tgq-field="min_pct" name="<?php echo esc_attr( "tg_quiz[results][{$ri}][min_pct]" ); ?>" value="<?php echo esc_attr( (string) $min_pct ); ?>" required />
					</div>
					<div>
						<label class="tgq-adm-label"><?php esc_html_e( 'Título da faixa (máx. 80)', 'teoriageek' ); ?></label>
						<input type="text" maxlength="80" class="widefat" data-tgq-field="title" name="<?php echo esc_attr( "tg_quiz[results][{$ri}][title]" ); ?>" value="<?php echo esc_attr( $title ); ?>" placeholder="<?php esc_attr_e( 'Ex.: Mestre Supremo do Universo!', 'teoriageek' ); ?>" required />
					</div>
				</div>
				<div class="tgq-adm-field">
					<label class="tgq-adm-label"><?php esc_html_e( 'Descrição opcional (máx. 400)', 'teoriageek' ); ?></label>
					<textarea rows="2" maxlength="400" class="widefat" data-tgq-field="description" name="<?php echo esc_attr( "tg_quiz[results][{$ri}][description]" ); ?>"><?php echo esc_textarea( $desc ); ?></textarea>
				</div>
				<div class="tgq-adm-field" style="margin-bottom:0;">
					<span class="tgq-adm-label"><?php esc_html_e( 'Imagem opcional da faixa', 'teoriageek' ); ?></span>
					<?php tg_quiz_render_media_picker_field( "tg_quiz[results][{$ri}][image_id]", $img_id ); ?>
				</div>
			</div>
		<?php endforeach; ?>
	</div>

	<button type="button" class="button button-secondary" id="tgq-add-result">
		<?php esc_html_e( '+ Adicionar faixa de resultado', 'teoriageek' ); ?>
	</button>

	<template id="tgq-result-tpl">
		<div class="tgq-card" data-tgq-result>
			<div class="tgq-card-head">
				<h4 class="tgq-card-title" data-tgq-result-heading><?php esc_html_e( 'Nova faixa', 'teoriageek' ); ?></h4>
				<button type="button" class="button-link-delete" data-tgq-remove-result><?php esc_html_e( 'Remover faixa', 'teoriageek' ); ?></button>
			</div>
			<div class="tgq-grid-row">
				<div>
					<label class="tgq-adm-label"><?php esc_html_e( '% Mínima (0–100)', 'teoriageek' ); ?></label>
					<input type="number" min="0" max="100" step="1" class="widefat" data-tgq-field="min_pct" name="" value="50" required />
				</div>
				<div>
					<label class="tgq-adm-label"><?php esc_html_e( 'Título da faixa (máx. 80)', 'teoriageek' ); ?></label>
					<input type="text" maxlength="80" class="widefat" data-tgq-field="title" name="" value="" required />
				</div>
			</div>
			<div class="tgq-adm-field">
				<label class="tgq-adm-label"><?php esc_html_e( 'Descrição opcional (máx. 400)', 'teoriageek' ); ?></label>
				<textarea rows="2" maxlength="400" class="widefat" data-tgq-field="description" name=""></textarea>
			</div>
			<div class="tgq-adm-field" style="margin-bottom:0;">
				<span class="tgq-adm-label"><?php esc_html_e( 'Imagem opcional da faixa', 'teoriageek' ); ?></span>
				<?php tg_quiz_render_media_picker_field( '', 0 ); ?>
			</div>
		</div>
	</template>
	<?php
}

/**
 * Meta Box 3: Perguntas (3 a 15) e alternativas (2 a 5, radio por pergunta para a correta).
 *
 * @param WP_Post $post Quiz atual.
 */
function tg_quiz_render_questions_meta_box( $post ) {
	$state     = tg_quiz_get_editor_state( $post );
	$questions = $state['questions'];
	?>
	<p class="description" style="margin-bottom:10px;">
		<?php esc_html_e( 'Cadastre de 3 a 15 perguntas (2 a 5 alternativas cada). Marque o botão de opção ao lado da única alternativa correta de cada pergunta.', 'teoriageek' ); ?>
	</p>

	<div id="tgq-questions-list">
		<?php foreach ( $questions as $qi => $q ) : ?>
			<?php
			$q_text = isset( $q['text'] ) ? (string) $q['text'] : '';
			$q_exp  = isset( $q['explanation'] ) ? (string) $q['explanation'] : '';
			$q_img  = isset( $q['image_id'] ) ? absint( $q['image_id'] ) : 0;
			$q_corr = isset( $q['correct'] ) ? (int) $q['correct'] : -1;
			$q_opts = isset( $q['options'] ) && is_array( $q['options'] ) ? array_values( $q['options'] ) : array();
			?>
			<div class="tgq-card" data-tgq-question>
				<div class="tgq-card-head">
					<h4 class="tgq-card-title" data-tgq-question-heading><?php echo esc_html( sprintf( __( 'Pergunta #%d', 'teoriageek' ), $qi + 1 ) ); ?></h4>
					<div class="tgq-btn-group">
						<button type="button" class="button button-small" data-tgq-move-question="-1" aria-label="<?php esc_attr_e( 'Mover pergunta para cima', 'teoriageek' ); ?>" title="<?php esc_attr_e( 'Mover para cima', 'teoriageek' ); ?>">▲</button>
						<button type="button" class="button button-small" data-tgq-move-question="1" aria-label="<?php esc_attr_e( 'Mover pergunta para baixo', 'teoriageek' ); ?>" title="<?php esc_attr_e( 'Mover para baixo', 'teoriageek' ); ?>">▼</button>
						<button type="button" class="button-link-delete" data-tgq-remove-question><?php esc_html_e( 'Remover', 'teoriageek' ); ?></button>
					</div>
				</div>

				<div class="tgq-adm-field">
					<label class="tgq-adm-label"><?php esc_html_e( 'Enunciado da pergunta (máx. 200)', 'teoriageek' ); ?></label>
					<input type="text" maxlength="200" class="widefat" data-tgq-field="text" name="<?php echo esc_attr( "tg_quiz[questions][{$qi}][text]" ); ?>" value="<?php echo esc_attr( $q_text ); ?>" required />
				</div>

				<div class="tgq-adm-field">
					<span class="tgq-adm-label"><?php esc_html_e( 'Imagem opcional da pergunta', 'teoriageek' ); ?></span>
					<?php tg_quiz_render_media_picker_field( "tg_quiz[questions][{$qi}][image_id]", $q_img ); ?>
				</div>

				<div class="tgq-adm-field">
					<span class="tgq-adm-label"><?php esc_html_e( 'Alternativas (selecione o círculo da alternativa correta · máx. 120 caracteres cada)', 'teoriageek' ); ?></span>
					<div class="tgq-opt-list" data-tgq-options-list>
						<?php foreach ( $q_opts as $oi => $opt ) : ?>
							<?php $opt_label = isset( $opt['label'] ) ? (string) $opt['label'] : ''; ?>
							<div class="tgq-opt-row" data-tgq-option>
								<input
									type="radio"
									data-tgq-correct
									name="<?php echo esc_attr( "tg_quiz[questions][{$qi}][correct]" ); ?>"
									value="<?php echo esc_attr( (string) $oi ); ?>"
									<?php checked( $q_corr, $oi ); ?>
									aria-label="<?php esc_attr_e( 'Marcar como alternativa correta', 'teoriageek' ); ?>"
								/>
								<input
									type="text"
									maxlength="120"
									data-tgq-opt-label
									name="<?php echo esc_attr( "tg_quiz[questions][{$qi}][options][{$oi}][label]" ); ?>"
									value="<?php echo esc_attr( $opt_label ); ?>"
									placeholder="<?php esc_attr_e( 'Texto da alternativa', 'teoriageek' ); ?>"
									required
								/>
								<button type="button" class="button button-small" data-tgq-move-option="-1" aria-label="<?php esc_attr_e( 'Mover alternativa para cima', 'teoriageek' ); ?>">▲</button>
								<button type="button" class="button button-small" data-tgq-move-option="1" aria-label="<?php esc_attr_e( 'Mover alternativa para baixo', 'teoriageek' ); ?>">▼</button>
								<button type="button" class="button-link-delete" data-tgq-remove-option aria-label="<?php esc_attr_e( 'Remover alternativa', 'teoriageek' ); ?>">✕</button>
							</div>
						<?php endforeach; ?>
					</div>
					<button type="button" class="button button-small" data-tgq-add-option>
						<?php esc_html_e( '+ Adicionar alternativa', 'teoriageek' ); ?>
					</button>
				</div>

				<div class="tgq-adm-field" style="margin-bottom:0;">
					<label class="tgq-adm-label"><?php esc_html_e( 'Explicação exibida após a resposta (opcional · máx. 300)', 'teoriageek' ); ?></label>
					<textarea rows="2" maxlength="300" class="widefat" data-tgq-field="explanation" name="<?php echo esc_attr( "tg_quiz[questions][{$qi}][explanation]" ); ?>"><?php echo esc_textarea( $q_exp ); ?></textarea>
				</div>
			</div>
		<?php endforeach; ?>
	</div>

	<button type="button" class="button button-primary" id="tgq-add-question">
		<?php esc_html_e( '+ Adicionar pergunta', 'teoriageek' ); ?>
	</button>

	<template id="tgq-option-tpl">
		<div class="tgq-opt-row" data-tgq-option>
			<input type="radio" data-tgq-correct name="" value="0" aria-label="<?php esc_attr_e( 'Marcar como alternativa correta', 'teoriageek' ); ?>" />
			<input type="text" maxlength="120" data-tgq-opt-label name="" value="" placeholder="<?php esc_attr_e( 'Texto da alternativa', 'teoriageek' ); ?>" required />
			<button type="button" class="button button-small" data-tgq-move-option="-1" aria-label="<?php esc_attr_e( 'Mover alternativa para cima', 'teoriageek' ); ?>">▲</button>
			<button type="button" class="button button-small" data-tgq-move-option="1" aria-label="<?php esc_attr_e( 'Mover alternativa para baixo', 'teoriageek' ); ?>">▼</button>
			<button type="button" class="button-link-delete" data-tgq-remove-option aria-label="<?php esc_attr_e( 'Remover alternativa', 'teoriageek' ); ?>">✕</button>
		</div>
	</template>

	<template id="tgq-question-tpl">
		<div class="tgq-card" data-tgq-question>
			<div class="tgq-card-head">
				<h4 class="tgq-card-title" data-tgq-question-heading><?php esc_html_e( 'Nova pergunta', 'teoriageek' ); ?></h4>
				<div class="tgq-btn-group">
					<button type="button" class="button button-small" data-tgq-move-question="-1" aria-label="<?php esc_attr_e( 'Mover pergunta para cima', 'teoriageek' ); ?>">▲</button>
					<button type="button" class="button button-small" data-tgq-move-question="1" aria-label="<?php esc_attr_e( 'Mover pergunta para baixo', 'teoriageek' ); ?>">▼</button>
					<button type="button" class="button-link-delete" data-tgq-remove-question><?php esc_html_e( 'Remover', 'teoriageek' ); ?></button>
				</div>
			</div>
			<div class="tgq-adm-field">
				<label class="tgq-adm-label"><?php esc_html_e( 'Enunciado da pergunta (máx. 200)', 'teoriageek' ); ?></label>
				<input type="text" maxlength="200" class="widefat" data-tgq-field="text" name="" value="" required />
			</div>
			<div class="tgq-adm-field">
				<span class="tgq-adm-label"><?php esc_html_e( 'Imagem opcional da pergunta', 'teoriageek' ); ?></span>
				<?php tg_quiz_render_media_picker_field( '', 0 ); ?>
			</div>
			<div class="tgq-adm-field">
				<span class="tgq-adm-label"><?php esc_html_e( 'Alternativas (selecione o círculo da alternativa correta · máx. 120 caracteres cada)', 'teoriageek' ); ?></span>
				<div class="tgq-opt-list" data-tgq-options-list>
					<div class="tgq-opt-row" data-tgq-option>
						<input type="radio" data-tgq-correct name="" value="0" aria-label="<?php esc_attr_e( 'Marcar como alternativa correta', 'teoriageek' ); ?>" />
						<input type="text" maxlength="120" data-tgq-opt-label name="" value="" placeholder="<?php esc_attr_e( 'Texto da alternativa', 'teoriageek' ); ?>" required />
						<button type="button" class="button button-small" data-tgq-move-option="-1" aria-label="<?php esc_attr_e( 'Mover alternativa para cima', 'teoriageek' ); ?>">▲</button>
						<button type="button" class="button button-small" data-tgq-move-option="1" aria-label="<?php esc_attr_e( 'Mover alternativa para baixo', 'teoriageek' ); ?>">▼</button>
						<button type="button" class="button-link-delete" data-tgq-remove-option aria-label="<?php esc_attr_e( 'Remover alternativa', 'teoriageek' ); ?>">✕</button>
					</div>
					<div class="tgq-opt-row" data-tgq-option>
						<input type="radio" data-tgq-correct name="" value="1" aria-label="<?php esc_attr_e( 'Marcar como alternativa correta', 'teoriageek' ); ?>" />
						<input type="text" maxlength="120" data-tgq-opt-label name="" value="" placeholder="<?php esc_attr_e( 'Texto da alternativa', 'teoriageek' ); ?>" required />
						<button type="button" class="button button-small" data-tgq-move-option="-1" aria-label="<?php esc_attr_e( 'Mover alternativa para cima', 'teoriageek' ); ?>">▲</button>
						<button type="button" class="button button-small" data-tgq-move-option="1" aria-label="<?php esc_attr_e( 'Mover alternativa para baixo', 'teoriageek' ); ?>">▼</button>
						<button type="button" class="button-link-delete" data-tgq-remove-option aria-label="<?php esc_attr_e( 'Remover alternativa', 'teoriageek' ); ?>">✕</button>
					</div>
					<div class="tgq-opt-row" data-tgq-option>
						<input type="radio" data-tgq-correct name="" value="2" aria-label="<?php esc_attr_e( 'Marcar como alternativa correta', 'teoriageek' ); ?>" />
						<input type="text" maxlength="120" data-tgq-opt-label name="" value="" placeholder="<?php esc_attr_e( 'Texto da alternativa', 'teoriageek' ); ?>" required />
						<button type="button" class="button button-small" data-tgq-move-option="-1" aria-label="<?php esc_attr_e( 'Mover alternativa para cima', 'teoriageek' ); ?>">▲</button>
						<button type="button" class="button button-small" data-tgq-move-option="1" aria-label="<?php esc_attr_e( 'Mover alternativa para baixo', 'teoriageek' ); ?>">▼</button>
						<button type="button" class="button-link-delete" data-tgq-remove-option aria-label="<?php esc_attr_e( 'Remover alternativa', 'teoriageek' ); ?>">✕</button>
					</div>
				</div>
				<button type="button" class="button button-small" data-tgq-add-option>
					<?php esc_html_e( '+ Adicionar alternativa', 'teoriageek' ); ?>
				</button>
			</div>
			<div class="tgq-adm-field" style="margin-bottom:0;">
				<label class="tgq-adm-label"><?php esc_html_e( 'Explicação exibida após a resposta (opcional · máx. 300)', 'teoriageek' ); ?></label>
				<textarea rows="2" maxlength="300" class="widefat" data-tgq-field="explanation" name=""></textarea>
			</div>
		</div>
	</template>
	<?php
}

/**
 * Meta Box 4 (lateral, exclusivo para `manage_options`): Diagnóstico mínimo de IP / proxy.
 */
function tg_quiz_render_diag_meta_box() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$remote_addr = isset( $_SERVER['REMOTE_ADDR'] ) ? trim( sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) ) : '';
	$cf_ip       = isset( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ? trim( sanitize_text_field( wp_unslash( $_SERVER['HTTP_CF_CONNECTING_IP'] ) ) ) : '';
	$xff_raw     = isset( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ? trim( sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) ) : '';
	$xff_first   = '' !== $xff_raw ? trim( explode( ',', $xff_raw )[0] ) : '';

	$behind_proxy = ( '' !== $cf_ip && $cf_ip !== $remote_addr ) || ( '' !== $xff_first && $xff_first !== $remote_addr );
	?>
	<p style="margin:0 0 6px;font-size:12px;">
		<strong>REMOTE_ADDR:</strong> <code><?php echo esc_html( '' !== $remote_addr ? $remote_addr : 'unknown' ); ?></code>
	</p>
	<?php if ( $behind_proxy ) : ?>
		<p style="margin:8px 0 0;padding:8px 10px;border-left:3px solid #dba617;background:#fcf9e8;font-size:12px;color:#1d2327;">
			<?php esc_html_e( 'O site parece estar atrás de proxy: o rate limit por IP pode agrupar leitores diferentes', 'teoriageek' ); ?>
		</p>
	<?php endif; ?>
	<?php
}

/**
 * Colunas administrativas em `edit.php?post_type=tg_quiz`: Iniciados, Concluídos, Conclusão (%) e Shortcode.
 *
 * @param array<string, string> $columns Colunas originais.
 * @return array<string, string>
 */
function tg_quiz_admin_columns( $columns ) {
	$out = array();
	foreach ( $columns as $key => $label ) {
		$out[ $key ] = $label;
		if ( 'title' === $key ) {
			$out['tg_quiz_starts']    = __( 'Iniciados', 'teoriageek' );
			$out['tg_quiz_plays']     = __( 'Concluídos', 'teoriageek' );
			$out['tg_quiz_rate']      = __( 'Conclusão (%)', 'teoriageek' );
			$out['tg_quiz_shortcode'] = __( 'Shortcode', 'teoriageek' );
		}
	}
	return $out;
}
add_filter( 'manage_tg_quiz_posts_columns', 'tg_quiz_admin_columns' );

/**
 * Renderiza o conteúdo das colunas personalizadas de `tg_quiz`.
 *
 * @param string $column  Identificador da coluna.
 * @param int    $post_id ID do quiz.
 */
function tg_quiz_render_admin_column( $column, $post_id ) {
	$pid    = (int) $post_id;
	$starts = max( 0, (int) get_post_meta( $pid, '_tg_quiz_starts_count', true ) );
	$plays  = max( 0, (int) get_post_meta( $pid, '_tg_quiz_plays_count', true ) );

	if ( 'tg_quiz_starts' === $column ) {
		echo esc_html( number_format_i18n( $starts ) );
	} elseif ( 'tg_quiz_plays' === $column ) {
		echo esc_html( number_format_i18n( $plays ) );
	} elseif ( 'tg_quiz_rate' === $column ) {
		if ( $starts <= 0 ) {
			echo '—';
		} else {
			echo esc_html( number_format_i18n( min( 100, ( $plays / $starts ) * 100 ), 1 ) . '%' );
		}
	} elseif ( 'tg_quiz_shortcode' === $column ) {
		printf( '<code>[tg_quiz id="%d"]</code>', $pid );
	}
}
add_action( 'manage_tg_quiz_posts_custom_column', 'tg_quiz_render_admin_column', 10, 2 );

/**
 * Resolve metadados públicos de uma imagem anexada do quiz.
 *
 * @param int $attachment_id ID do attachment.
 * @return array{url:string,alt:string,w:int,h:int}|null
 */
function tg_quiz_resolve_public_image( $attachment_id ) {
	$aid = absint( $attachment_id );
	if ( $aid <= 0 || ! wp_attachment_is_image( $aid ) ) {
		return null;
	}
	$src = wp_get_attachment_image_src( $aid, 'tg-card' );
	if ( ! is_array( $src ) || empty( $src[0] ) ) {
		$src = wp_get_attachment_image_src( $aid, 'large' );
	}
	if ( ! is_array( $src ) || empty( $src[0] ) ) {
		return null;
	}
	$alt = trim( sanitize_text_field( (string) get_post_meta( $aid, '_wp_attachment_image_alt', true ) ) );
	return array(
		'url' => (string) $src[0],
		'alt' => $alt,
		'w'   => isset( $src[1] ) ? (int) $src[1] : 640,
		'h'   => isset( $src[2] ) ? (int) $src[2] : 360,
	);
}

/**
 * Retorna os dados públicos prontos para o motor JS do quiz (ou null se inválido/não publicado).
 *
 * Atenção: `correct` é incluído intencionalmente no JSON entregue ao navegador para permitir
 * correção instantânea 100% client-side em páginas cacheadas pelo WP Super Cache.
 *
 * @param int $id ID do quiz.
 * @return array<string, mixed>|null
 */
function tg_quiz_get_public_data( $id ) {
	$qid  = absint( $id );
	$post = ( $qid > 0 ) ? get_post( $qid ) : null;
	if ( ! $post instanceof WP_Post || 'tg_quiz' !== $post->post_type || 'publish' !== $post->post_status ) {
		return null;
	}

	$raw_questions = tg_quiz_read_json_meta( $qid, '_tg_quiz_questions' );
	$raw_results   = tg_quiz_read_json_meta( $qid, '_tg_quiz_results' );
	if ( count( $raw_questions ) < 3 || empty( $raw_results ) ) {
		return null;
	}

	$questions = array();
	foreach ( array_slice( $raw_questions, 0, 15 ) as $q ) {
		if ( ! is_array( $q ) || empty( $q['options'] ) || ! is_array( $q['options'] ) ) {
			continue;
		}
		$opts = array();
		foreach ( array_slice( array_values( $q['options'] ), 0, 5 ) as $o ) {
			$lbl = is_array( $o ) && isset( $o['label'] ) ? trim( (string) $o['label'] ) : '';
			if ( '' !== $lbl ) {
				$opts[] = array( 'label' => mb_substr( $lbl, 0, 120, 'UTF-8' ) );
			}
		}
		$corr = isset( $q['correct'] ) ? (int) $q['correct'] : -1;
		$txt  = isset( $q['text'] ) ? trim( (string) $q['text'] ) : '';
		if ( '' === $txt || count( $opts ) < 2 || $corr < 0 || $corr >= count( $opts ) ) {
			continue;
		}
		$questions[] = array(
			'text'        => mb_substr( $txt, 0, 200, 'UTF-8' ),
			'image'       => tg_quiz_resolve_public_image( isset( $q['image_id'] ) ? $q['image_id'] : 0 ),
			'options'     => $opts,
			'correct'     => $corr,
			'explanation' => isset( $q['explanation'] ) ? mb_substr( trim( (string) $q['explanation'] ), 0, 300, 'UTF-8' ) : '',
		);
	}

	if ( count( $questions ) < 3 ) {
		return null;
	}

	$results = array();
	foreach ( array_slice( $raw_results, 0, 6 ) as $r ) {
		if ( ! is_array( $r ) ) {
			continue;
		}
		$r_title = isset( $r['title'] ) ? trim( (string) $r['title'] ) : '';
		if ( '' === $r_title ) {
			continue;
		}
		$results[] = array(
			'min_pct'     => max( 0, min( 100, isset( $r['min_pct'] ) ? (int) $r['min_pct'] : 0 ) ),
			'title'       => mb_substr( $r_title, 0, 80, 'UTF-8' ),
			'description' => isset( $r['description'] ) ? mb_substr( trim( (string) $r['description'] ), 0, 400, 'UTF-8' ) : '',
			'image'       => tg_quiz_resolve_public_image( isset( $r['image_id'] ) ? $r['image_id'] : 0 ),
		);
	}

	if ( empty( $results ) ) {
		return null;
	}

	usort(
		$results,
		static function ( $a, $b ) {
			return (int) $b['min_pct'] <=> (int) $a['min_pct'];
		}
	);

	$version = ( '' !== (string) $post->post_modified_gmt && '0000-00-00 00:00:00' !== (string) $post->post_modified_gmt )
		? (string) $post->post_modified_gmt
		: (string) $post->post_modified;

	// Usa post_title cru decodificado para preservar literal </script>, aspas e emojis sem entidades HTML de wptexturize.
	$clean_title = wp_specialchars_decode( html_entity_decode( teoriageek_fix_mojibake( (string) $post->post_title ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ), ENT_QUOTES );
	$clean_title = trim( (string) preg_replace( '/\s{2,}/u', ' ', $clean_title ) );

	return array(
		'id'        => $qid,
		'version'   => $version,
		'title'     => $clean_title,
		'url'       => (string) get_permalink( $qid ),
		'questions' => $questions,
		'results'   => $results,
		'plays'     => max( 0, (int) get_post_meta( $qid, '_tg_quiz_plays_count', true ) ),
		'restBase'  => esc_url_raw( rest_url( 'teoriageek/v1/quizzes/' ) ),
	);
}

/**
 * Monta os itens do bloco de recirculação pós-quiz:
 * até 2 matérias do mesmo `universo` (fallback: mesma `category`), excluindo o quiz e o post hospedeiro,
 * mais até 1 outro quiz publicado e recente.
 *
 * @param int $quiz_id      ID do quiz atual.
 * @param int $host_post_id ID do post que hospeda o embed (ou 0).
 * @return array{articles:WP_Post[],other_quiz:WP_Post|null}
 */
function tg_quiz_get_recirculation_items( $quiz_id, $host_post_id = 0 ) {
	$qid      = absint( $quiz_id );
	$exclude  = array_values( array_unique( array_filter( array( $qid, absint( $host_post_id ), absint( get_queried_object_id() ) ) ) ) );
	$articles = array();

	if ( taxonomy_exists( 'universo' ) ) {
		$u_terms = get_the_terms( $qid, 'universo' );
		if ( ! empty( $u_terms ) && ! is_wp_error( $u_terms ) ) {
			$u_ids = array_map( 'intval', wp_list_pluck( $u_terms, 'term_id' ) );
			$uq    = new WP_Query(
				array(
					'post_type'           => 'post',
					'post_status'         => 'publish',
					'posts_per_page'      => 2,
					'post__not_in'        => $exclude,
					'ignore_sticky_posts' => true,
					'no_found_rows'       => true,
					'tax_query'           => array(
						array(
							'taxonomy' => 'universo',
							'field'    => 'term_id',
							'terms'    => $u_ids,
						),
					),
				)
			);
			$articles = $uq->posts;
		}
	}

	if ( count( $articles ) < 2 ) {
		$cat_ids = wp_get_post_categories( $qid );
		if ( ! empty( $cat_ids ) && ! is_wp_error( $cat_ids ) ) {
			$needed = 2 - count( $articles );
			$not_in = array_values( array_unique( array_merge( $exclude, wp_list_pluck( $articles, 'ID' ) ) ) );
			$cq     = new WP_Query(
				array(
					'post_type'           => 'post',
					'post_status'         => 'publish',
					'posts_per_page'      => $needed,
					'post__not_in'        => $not_in,
					'category__in'        => array_map( 'intval', $cat_ids ),
					'ignore_sticky_posts' => true,
					'no_found_rows'       => true,
				)
			);
			$articles = array_merge( $articles, $cq->posts );
		}
	}

	$other_exclude = array_values( array_unique( array_filter( array( $qid, absint( $host_post_id ) ) ) ) );
	$other_q       = new WP_Query(
		array(
			'post_type'           => 'tg_quiz',
			'post_status'         => 'publish',
			'posts_per_page'      => 1,
			'post__not_in'        => $other_exclude,
			'orderby'             => 'date',
			'order'               => 'DESC',
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);

	return array(
		'articles'   => array_slice( $articles, 0, 2 ),
		'other_quiz' => ! empty( $other_q->posts[0] ) && $other_q->posts[0] instanceof WP_Post ? $other_q->posts[0] : null,
	);
}

/**
 * Registra `assets/js/quiz.js` em `wp_enqueue_scripts` e enfileira automaticamente em `is_singular( 'tg_quiz' )`.
 */
function tg_quiz_register_frontend_script() {
	wp_register_script(
		'teoriageek-quiz',
		TEORIAGEEK_URI . '/assets/js/quiz.js',
		array(),
		TEORIAGEEK_VERSION,
		true
	);

	if ( is_singular( 'tg_quiz' ) ) {
		wp_enqueue_script( 'teoriageek-quiz' );
	}
}
add_action( 'wp_enqueue_scripts', 'tg_quiz_register_frontend_script', 20 );

/**
 * Controla deduplicação por página para impedir renderização duplicada do mesmo quiz na mesma requisição.
 *
 * @param int $quiz_id ID do quiz.
 * @return bool True se já havia sido renderizado nesta página.
 */
function tg_quiz_mark_rendered( $quiz_id ) {
	if ( ! isset( $GLOBALS['tg_quiz_rendered_ids'] ) || ! is_array( $GLOBALS['tg_quiz_rendered_ids'] ) ) {
		$GLOBALS['tg_quiz_rendered_ids'] = array();
	}
	$qid = absint( $quiz_id );
	if ( isset( $GLOBALS['tg_quiz_rendered_ids'][ $qid ] ) ) {
		return true;
	}
	$GLOBALS['tg_quiz_rendered_ids'][ $qid ] = true;
	return false;
}

/**
 * Shortcode `[tg_quiz id="123"]` para incorporar um quiz publicado dentro de matérias ou páginas.
 *
 * @param array<string, mixed>|string $atts Atributos do shortcode.
 * @return string HTML do player ou string vazia se inválido/duplicado.
 */
function tg_quiz_shortcode_handler( $atts ) {
	if ( is_admin() || is_feed() || doing_action( 'wp_head' ) ) {
		return '';
	}

	$parsed = shortcode_atts(
		array(
			'id' => 0,
		),
		$atts,
		'tg_quiz'
	);

	$qid = absint( $parsed['id'] );
	if ( $qid <= 0 ) {
		return '';
	}

	$data = tg_quiz_get_public_data( $qid );
	if ( null === $data ) {
		return '';
	}

	if ( tg_quiz_mark_rendered( $qid ) ) {
		return '';
	}

	wp_enqueue_script( 'teoriageek-quiz' );

	$host_id = (int) get_the_ID();
	ob_start();
	get_template_part(
		'template-parts/quiz-player',
		null,
		array(
			'quiz_id'      => $qid,
			'data'         => $data,
			'mode'         => 'embed',
			'host_post_id' => $host_id,
		)
	);
	return (string) ob_get_clean();
}
add_shortcode( 'tg_quiz', 'tg_quiz_shortcode_handler' );

/**
 * Incrementa de forma atômica um contador inteiro em `wp_postmeta` (`_tg_quiz_starts_count` ou `_tg_quiz_plays_count`).
 *
 * @param int    $pid      ID do quiz.
 * @param string $meta_key Chave protegida do contador.
 * @return int Valor atualizado do contador.
 */
function tg_quiz_increment_counter( $pid, $meta_key ) {
	global $wpdb;
	$pid = absint( $pid );
	add_post_meta( $pid, $meta_key, 0, true );
	$wpdb->query(
		$wpdb->prepare(
			"UPDATE {$wpdb->postmeta} SET meta_value = CAST(meta_value AS UNSIGNED) + 1 WHERE post_id = %d AND meta_key = %s",
			$pid,
			$meta_key
		)
	);
	wp_cache_delete( $pid, 'post_meta' );
	return max( 0, (int) get_post_meta( $pid, $meta_key, true ) );
}

/**
 * Registra as rotas REST públicas `POST /teoriageek/v1/quizzes/{id}/start` e `/complete`.
 */
function tg_quiz_register_rest_routes() {
	register_rest_route(
		'teoriageek/v1',
		'/quizzes/(?P<id>\d+)/start',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => '__return_true',
			'args'                => array(
				'id' => array(
					'type'              => 'integer',
					'required'          => true,
					'sanitize_callback' => 'absint',
				),
			),
			'callback'            => static function ( WP_REST_Request $request ) {
				$qid  = absint( $request->get_param( 'id' ) );
				$post = ( $qid > 0 ) ? get_post( $qid ) : null;
				if ( ! $post instanceof WP_Post || 'tg_quiz' !== $post->post_type || 'publish' !== $post->post_status ) {
					return new WP_Error( 'not_found', __( 'Quiz não encontrado.', 'teoriageek' ), array( 'status' => 404 ) );
				}
				if ( function_exists( 'teoriageek_rest_rate_limit_ok' ) && ! teoriageek_rest_rate_limit_ok( 'quiz_start', 30 ) ) {
					return new WP_Error( 'rate_limited', __( 'Muitas requisições. Tente em instantes.', 'teoriageek' ), array( 'status' => 429 ) );
				}

				tg_quiz_increment_counter( $qid, '_tg_quiz_starts_count' );
				$res = rest_ensure_response( array( 'started' => true ) );
				if ( $res instanceof WP_REST_Response ) {
					$res->header( 'Cache-Control', 'no-store' );
				}
				return $res;
			},
		)
	);

	register_rest_route(
		'teoriageek/v1',
		'/quizzes/(?P<id>\d+)/complete',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => '__return_true',
			'args'                => array(
				'id' => array(
					'type'              => 'integer',
					'required'          => true,
					'sanitize_callback' => 'absint',
				),
			),
			'callback'            => static function ( WP_REST_Request $request ) {
				$qid  = absint( $request->get_param( 'id' ) );
				$post = ( $qid > 0 ) ? get_post( $qid ) : null;
				if ( ! $post instanceof WP_Post || 'tg_quiz' !== $post->post_type || 'publish' !== $post->post_status ) {
					return new WP_Error( 'not_found', __( 'Quiz não encontrado.', 'teoriageek' ), array( 'status' => 404 ) );
				}
				if ( function_exists( 'teoriageek_rest_rate_limit_ok' ) && ! teoriageek_rest_rate_limit_ok( 'quiz_complete', 20 ) ) {
					return new WP_Error( 'rate_limited', __( 'Muitas requisições. Tente em instantes.', 'teoriageek' ), array( 'status' => 429 ) );
				}

				$plays = tg_quiz_increment_counter( $qid, '_tg_quiz_plays_count' );
				$res   = rest_ensure_response( array( 'plays' => $plays ) );
				if ( $res instanceof WP_REST_Response ) {
					$res->header( 'Cache-Control', 'no-store' );
				}
				return $res;
			},
		)
	);
}
add_action( 'rest_api_init', 'tg_quiz_register_rest_routes' );
