<?php
/**
 * Teoria Geek — Meta Box Nativa "Ficha Editorial" (sem ACF ou plugins pagos).
 * Permite aos redatores controlar Manchete Principal, Plantão, Formato, Nota (0-10),
 * 3 Pontos-Chave para Reels/Matéria e Fonte Externa opcional direto no editor padrão do WordPress.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra a Meta Box "Ficha Editorial" na tela de edição de Posts.
 */
function teoriageek_register_editorial_meta_box() {
	add_meta_box(
		'teoriageek_editorial_box',
		__( 'Ficha Editorial — Teoria Geek (Opcional)', 'teoriageek' ),
		'teoriageek_render_editorial_meta_box',
		'post',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'teoriageek_register_editorial_meta_box' );

/**
 * Renderiza os campos amigáveis da Ficha Editorial.
 *
 * @param WP_Post $post Post em edição.
 */
function teoriageek_render_editorial_meta_box( $post ) {
	wp_nonce_field( 'teoriageek_save_editorial_meta', 'teoriageek_editorial_nonce' );

	$is_main_headline = (bool) get_post_meta( $post->ID, '_tg_main_headline', true );
	$is_plantao       = (bool) get_post_meta( $post->ID, '_tg_plantao', true );
	$editorial_format = (string) get_post_meta( $post->ID, '_tg_editorial_format', true );
	$review_score     = (string) get_post_meta( $post->ID, '_tg_review_score', true );
	$bullet_1         = (string) get_post_meta( $post->ID, '_tg_bullet_1', true );
	$bullet_2         = (string) get_post_meta( $post->ID, '_tg_bullet_2', true );
	$bullet_3         = (string) get_post_meta( $post->ID, '_tg_bullet_3', true );
	$source_name      = (string) get_post_meta( $post->ID, '_tg_source_name', true );
	$source_url       = (string) get_post_meta( $post->ID, '_tg_source_url', true );
	?>
	<style>
		.tg-metabox-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 8px; }
		.tg-metabox-card { background: #f8f9fa; border: 1px solid #dcdcde; border-radius: 6px; padding: 12px 14px; }
		.tg-metabox-card h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #1d2327; }
		.tg-metabox-field { margin-bottom: 10px; }
		.tg-metabox-field:last-child { margin-bottom: 0; }
		.tg-metabox-field label { display: block; font-weight: 600; margin-bottom: 4px; font-size: 12px; }
		.tg-metabox-field input[type="text"],
		.tg-metabox-field input[type="url"],
		.tg-metabox-field input[type="number"],
		.tg-metabox-field select { width: 100%; }
		.tg-metabox-check { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600; }
		.tg-metabox-help { font-size: 11px; color: #646970; margin-top: 3px; }
	</style>

	<p style="margin: 0 0 8px; color: #50575e;">
		<?php esc_html_e( 'Todos os campos abaixo são opcionais. Se você apenas escrever o título, texto e imagem destacada, o tema organiza a capa e os Reels automaticamente.', 'teoriageek' ); ?>
	</p>

	<div class="tg-metabox-grid">
		<div class="tg-metabox-card">
			<h4><?php esc_html_e( 'Posição na Capa & Formato', 'teoriageek' ); ?></h4>

			<label class="tg-metabox-check" for="tg_main_headline">
				<input type="checkbox" id="tg_main_headline" name="tg_main_headline" value="1" <?php checked( $is_main_headline ); ?> />
				<span><?php esc_html_e( 'Fixar como Manchete Principal da Capa', 'teoriageek' ); ?></span>
			</label>
			<p class="tg-metabox-help" style="margin-bottom: 10px;">
				<?php esc_html_e( 'Tem prioridade sobre a categoria DESTAQUE. Ao marcar, desmarca automaticamente a manchete principal anterior.', 'teoriageek' ); ?>
			</p>

			<label class="tg-metabox-check" for="tg_plantao">
				<input type="checkbox" id="tg_plantao" name="tg_plantao" value="1" <?php checked( $is_plantao ); ?> />
				<span><?php esc_html_e( 'Destacar no Plantão (faixa deslizante do topo)', 'teoriageek' ); ?></span>
			</label>

			<div class="tg-metabox-field" style="margin-top: 10px;">
				<label for="tg_editorial_format"><?php esc_html_e( 'Formato Editorial', 'teoriageek' ); ?></label>
				<select id="tg_editorial_format" name="tg_editorial_format">
					<option value="" <?php selected( $editorial_format, '' ); ?>><?php esc_html_e( 'Detectar automaticamente pela categoria', 'teoriageek' ); ?></option>
					<option value="noticia" <?php selected( $editorial_format, 'noticia' ); ?>><?php esc_html_e( 'Notícia', 'teoriageek' ); ?></option>
					<option value="critica" <?php selected( $editorial_format, 'critica' ); ?>><?php esc_html_e( 'Crítica', 'teoriageek' ); ?></option>
					<option value="review" <?php selected( $editorial_format, 'review' ); ?>><?php esc_html_e( 'Review', 'teoriageek' ); ?></option>
					<option value="especial" <?php selected( $editorial_format, 'especial' ); ?>><?php esc_html_e( 'Especial / Coluna', 'teoriageek' ); ?></option>
				</select>
			</div>

			<div class="tg-metabox-field">
				<label for="tg_review_score"><?php esc_html_e( 'Nota da Crítica / Review (0 a 10)', 'teoriageek' ); ?></label>
				<input type="number" id="tg_review_score" name="tg_review_score" min="0" max="10" step="0.1" value="<?php echo esc_attr( $review_score ); ?>" placeholder="Ex.: 9.2" />
				<p class="tg-metabox-help"><?php esc_html_e( 'Exibe selo de nota na capa, na matéria e na Lâmina 3 dos Reels.', 'teoriageek' ); ?></p>
			</div>
		</div>

		<div class="tg-metabox-card">
			<h4><?php esc_html_e( 'Resumo em 3 Pontos-Chave (Matéria & Reels)', 'teoriageek' ); ?></h4>
			<p class="tg-metabox-help" style="margin: 0 0 10px;">
				<?php esc_html_e( 'Exibidos na abertura da matéria e na Lâmina 2 ("Em 10 segundos") dos Reels. Se ficarem vazios, o tema gera trechos automaticamente.', 'teoriageek' ); ?>
			</p>

			<div class="tg-metabox-field">
				<label for="tg_bullet_1"><?php esc_html_e( 'Ponto-chave 1', 'teoriageek' ); ?></label>
				<input type="text" id="tg_bullet_1" name="tg_bullet_1" maxlength="160" value="<?php echo esc_attr( $bullet_1 ); ?>" placeholder="Ex.: Estreia confirmada para dezembro de 2026 nos cinemas" />
			</div>

			<div class="tg-metabox-field">
				<label for="tg_bullet_2"><?php esc_html_e( 'Ponto-chave 2', 'teoriageek' ); ?></label>
				<input type="text" id="tg_bullet_2" name="tg_bullet_2" maxlength="160" value="<?php echo esc_attr( $bullet_2 ); ?>" placeholder="Ex.: Novo trailer destaca o retorno de personagens clássicos" />
			</div>

			<div class="tg-metabox-field">
				<label for="tg_bullet_3"><?php esc_html_e( 'Ponto-chave 3', 'teoriageek' ); ?></label>
				<input type="text" id="tg_bullet_3" name="tg_bullet_3" maxlength="160" value="<?php echo esc_attr( $bullet_3 ); ?>" placeholder="Ex.: Pré-venda nacional começa duas semanas antes da estreia" />
			</div>
		</div>

		<div class="tg-metabox-card">
			<h4><?php esc_html_e( 'Crédito / Fonte Externa (Opcional)', 'teoriageek' ); ?></h4>
			<p class="tg-metabox-help" style="margin: 0 0 10px;">
				<?php esc_html_e( 'Preencha apenas se a notícia tiver referência externa. Em matérias 100% autorais, deixe em branco para ocultar o bloco de fonte.', 'teoriageek' ); ?>
			</p>

			<div class="tg-metabox-field">
				<label for="tg_source_name"><?php esc_html_e( 'Nome do veículo / fonte', 'teoriageek' ); ?></label>
				<input type="text" id="tg_source_name" name="tg_source_name" maxlength="120" value="<?php echo esc_attr( $source_name ); ?>" placeholder="Ex.: Marvel Studios, Gematsu, Variety" />
			</div>

			<div class="tg-metabox-field">
				<label for="tg_source_url"><?php esc_html_e( 'Link oficial da fonte (https://...)', 'teoriageek' ); ?></label>
				<input type="url" id="tg_source_url" name="tg_source_url" value="<?php echo esc_url( $source_url ); ?>" placeholder="https://..." />
			</div>
		</div>
	</div>
	<?php
}

/**
 * Salva os metadados da Ficha Editorial com validação rigorosa de nonce e permissões.
 *
 * @param int $post_id ID do post salvo.
 */
function teoriageek_save_editorial_meta( $post_id ) {
	if ( ! isset( $_POST['teoriageek_editorial_nonce'] ) ) {
		return;
	}
	if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['teoriageek_editorial_nonce'] ) ), 'teoriageek_save_editorial_meta' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	// 1. Manchete Principal (garante unicidade ao marcar um novo post).
	$is_main = isset( $_POST['tg_main_headline'] ) && '1' === $_POST['tg_main_headline'];
	if ( $is_main ) {
		$previous = get_posts(
			array(
				'post_type'      => 'post',
				'post_status'    => 'any',
				'posts_per_page' => 20,
				'fields'         => 'ids',
				'exclude'        => array( $post_id ),
				'meta_key'       => '_tg_main_headline',
				'meta_value'     => '1',
			)
		);
		foreach ( $previous as $prev_id ) {
			delete_post_meta( $prev_id, '_tg_main_headline' );
		}
		update_post_meta( $post_id, '_tg_main_headline', '1' );
	} else {
		delete_post_meta( $post_id, '_tg_main_headline' );
	}

	// 2. Plantão.
	if ( isset( $_POST['tg_plantao'] ) && '1' === $_POST['tg_plantao'] ) {
		update_post_meta( $post_id, '_tg_plantao', '1' );
	} else {
		delete_post_meta( $post_id, '_tg_plantao' );
	}

	// 3. Formato editorial.
	$allowed_formats = array( '', 'noticia', 'critica', 'review', 'especial' );
	$format          = isset( $_POST['tg_editorial_format'] ) ? sanitize_key( wp_unslash( $_POST['tg_editorial_format'] ) ) : '';
	if ( in_array( $format, $allowed_formats, true ) && '' !== $format ) {
		update_post_meta( $post_id, '_tg_editorial_format', $format );
	} else {
		delete_post_meta( $post_id, '_tg_editorial_format' );
	}

	// 4. Nota (0 a 10).
	$raw_score = isset( $_POST['tg_review_score'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['tg_review_score'] ) ) ) : '';
	if ( '' !== $raw_score && is_numeric( str_replace( ',', '.', $raw_score ) ) ) {
		$score = max( 0, min( 10, (float) str_replace( ',', '.', $raw_score ) ) );
		update_post_meta( $post_id, '_tg_review_score', number_format( $score, 1, '.', '' ) );
	} else {
		delete_post_meta( $post_id, '_tg_review_score' );
	}

	// 5. Três pontos-chave.
	for ( $i = 1; $i <= 3; $i++ ) {
		$field = 'tg_bullet_' . $i;
		$val   = isset( $_POST[ $field ] ) ? sanitize_text_field( wp_unslash( $_POST[ $field ] ) ) : '';
		if ( '' !== $val ) {
			update_post_meta( $post_id, '_tg_bullet_' . $i, mb_substr( $val, 0, 160 ) );
		} else {
			delete_post_meta( $post_id, '_tg_bullet_' . $i );
		}
	}

	// 6. Fonte externa opcional.
	$source_name = isset( $_POST['tg_source_name'] ) ? sanitize_text_field( wp_unslash( $_POST['tg_source_name'] ) ) : '';
	$source_url  = isset( $_POST['tg_source_url'] ) ? teoriageek_safe_http_url( wp_unslash( $_POST['tg_source_url'] ) ) : '';

	if ( '' !== $source_name ) {
		update_post_meta( $post_id, '_tg_source_name', $source_name );
	} else {
		delete_post_meta( $post_id, '_tg_source_name' );
	}

	if ( '' !== $source_url ) {
		update_post_meta( $post_id, '_tg_source_url', $source_url );
	} else {
		delete_post_meta( $post_id, '_tg_source_url' );
	}
}
add_action( 'save_post_post', 'teoriageek_save_editorial_meta' );
