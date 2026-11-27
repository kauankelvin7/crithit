<?php
/**
 * Template Part: Player interativo de Quiz (Trivia) — Teoria Geek v2.13.0.
 *
 * Renderiza uma instância isolada do quiz (em `single-tg_quiz.php` ou via shortcode `[tg_quiz]`),
 * embutindo os dados serializados com `JSON_HEX_*` em `<script type="application/json">` próprio
 * (sem `wp_localize_script`, permitindo múltiplos quizzes distintos na mesma página).
 *
 * Nota técnica: as alternativas corretas (`correct`) ficam visíveis no JSON do HTML para viabilizar
 * feedback imediato 100% client-side em páginas cacheadas pelo WP Super Cache (decisão intencional
 * para quizzes editoriais de entretenimento).
 *
 * @package TeoriaGeek
 * @var array $args {
 *     quiz_id?: int,
 *     data?: array<string, mixed>,
 *     mode?: string,
 *     host_post_id?: int
 * }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_qid = isset( $args['quiz_id'] ) ? absint( $args['quiz_id'] ) : (int) get_the_ID();
if ( $tg_qid <= 0 ) {
	return;
}

$tg_data = isset( $args['data'] ) && is_array( $args['data'] ) ? $args['data'] : tg_quiz_get_public_data( $tg_qid );
if ( ! is_array( $tg_data ) || empty( $tg_data['questions'] ) || empty( $tg_data['results'] ) ) {
	return;
}

$tg_mode    = ( isset( $args['mode'] ) && 'embed' === $args['mode'] ) ? 'embed' : 'single';
$tg_host_id = isset( $args['host_post_id'] ) ? absint( $args['host_post_id'] ) : 0;

if ( 'single' === $tg_mode ) {
	tg_quiz_mark_rendered( $tg_qid );
}

$tg_recirc = tg_quiz_get_recirculation_items( $tg_qid, $tg_host_id );
$tg_cards  = array();
if ( ! empty( $tg_recirc['articles'] ) && is_array( $tg_recirc['articles'] ) ) {
	foreach ( $tg_recirc['articles'] as $tg_art ) {
		if ( $tg_art instanceof WP_Post ) {
			$tg_cards[] = $tg_art;
		}
	}
}
if ( isset( $tg_recirc['other_quiz'] ) && $tg_recirc['other_quiz'] instanceof WP_Post ) {
	$tg_cards[] = $tg_recirc['other_quiz'];
}

$tg_json = wp_json_encode(
	$tg_data,
	JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
if ( false === $tg_json ) {
	return;
}
?>
<!--tg-quiz-block-start-->
<section
	class="tg-quiz <?php echo 'embed' === $tg_mode ? 'tg-quiz--embed' : 'tg-quiz--single'; ?>"
	data-tg-quiz
	data-tg-quiz-mode="<?php echo esc_attr( $tg_mode ); ?>"
	data-tg-quiz-id="<?php echo esc_attr( (string) $tg_qid ); ?>"
	data-version="<?php echo esc_attr( (string) $tg_data['version'] ); ?>"
	data-rest="<?php echo esc_url( (string) $tg_data['restBase'] ); ?>"
	aria-label="<?php echo esc_attr( sprintf( __( 'Quiz: %s', 'teoriageek' ), (string) $tg_data['title'] ) ); ?>"
>
	<?php if ( 'embed' === $tg_mode ) : ?>
		<div class="tg-quiz__embed-head">
			<span class="tg-quiz__kicker"><?php esc_html_e( 'Quiz Teoria Geek', 'teoriageek' ); ?></span>
			<p class="tg-quiz__title"><?php echo esc_html( (string) $tg_data['title'] ); ?></p>
		</div>
	<?php endif; ?>

	<script type="application/json" class="tg-quiz-data"><?php echo $tg_json; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escapado via JSON_HEX_TAG|AMP|APOS|QUOT. ?></script>

	<div class="tg-quiz__live sr-only" aria-live="polite" aria-atomic="true" data-tg-quiz-live></div>

	<div class="tg-quiz__mount" data-tg-quiz-mount></div>

	<noscript>
		<p class="tg-quiz__noscript"><?php esc_html_e( 'Este quiz precisa de JavaScript para funcionar.', 'teoriageek' ); ?></p>
	</noscript>

	<div class="tg-quiz__after" hidden data-tg-quiz-after>
		<?php if ( ! empty( $tg_cards ) ) : ?>
			<div class="tg-quiz__after-head">
				<p class="tg-quiz__after-title"><?php esc_html_e( 'Continue no Teoria Geek', 'teoriageek' ); ?></p>
			</div>
			<div class="tg-quiz__recirc-grid">
				<?php foreach ( $tg_cards as $tg_rec_post ) : ?>
					<?php
					get_template_part(
						'template-parts/card-article',
						null,
						array(
							'post'        => $tg_rec_post,
							'variant'     => 'compact-grid',
							'heading_tag' => 'embed' === $tg_mode ? 'h4' : 'h3',
						)
					);
					?>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</section>
<!--tg-quiz-block-end-->
