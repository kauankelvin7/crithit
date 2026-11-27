<?php
/**
 * Template Part: Linha do Tempo de Cobertura Especial / Série Editorial (taxonomia `universo`).
 * Exibe um card compacto quando a matéria faz parte de um universo/franquia com 3 ou mais publicações,
 * estimulando leitura em sequência sem poluir o texto principal.
 *
 * @package TeoriaGeek
 * @var array $args { post_id?: int }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_pid = isset( $args['post_id'] ) ? (int) $args['post_id'] : (int) get_the_ID();
if ( $tg_pid <= 0 || ! taxonomy_exists( 'universo' ) ) {
	return;
}

$tg_terms = get_the_terms( $tg_pid, 'universo' );
if ( empty( $tg_terms ) || is_wp_error( $tg_terms ) ) {
	return;
}

$tg_primary_universe = null;
foreach ( $tg_terms as $tg_term ) {
	if ( (int) $tg_term->count >= 3 ) {
		$tg_primary_universe = $tg_term;
		break;
	}
}

if ( ! $tg_primary_universe instanceof WP_Term ) {
	return;
}

$tg_series_query = new WP_Query(
	array(
		'post_type'              => 'post',
		'post_status'            => 'publish',
		'posts_per_page'         => 4,
		'ignore_sticky_posts'    => true,
		'no_found_rows'          => true,
		'update_post_meta_cache' => false,
		'tax_query'              => array(
			array(
				'taxonomy' => 'universo',
				'field'    => 'term_id',
				'terms'    => (int) $tg_primary_universe->term_id,
			),
		),
	)
);

if ( count( $tg_series_query->posts ) < 2 ) {
	return;
}

$tg_term_link = get_term_link( $tg_primary_universe );
$tg_term_name = html_entity_decode( (string) $tg_primary_universe->name, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
?>
<section aria-label="<?php echo esc_attr( sprintf( __( 'Cobertura completa: %s', 'teoriageek' ), $tg_term_name ) ); ?>" class="tg-series-box">
	<div class="tg-series-head">
		<div>
			<span class="tg-series-kicker"><?php esc_html_e( 'Cobertura Especial', 'teoriageek' ); ?></span>
			<h3 class="tg-series-title">
				<?php echo esc_html( sprintf( __( 'Tudo sobre %s', 'teoriageek' ), $tg_term_name ) ); ?>
			</h3>
		</div>
		<?php if ( ! is_wp_error( $tg_term_link ) ) : ?>
			<a href="<?php echo esc_url( $tg_term_link ); ?>" class="tg-series-all">
				<?php
				echo esc_html(
					sprintf(
						/* translators: %d: quantidade de matérias no universo */
						__( 'Ver todas (%d)', 'teoriageek' ),
						(int) $tg_primary_universe->count
					)
				);
				?>
				<span aria-hidden="true">→</span>
			</a>
		<?php endif; ?>
	</div>

	<ol class="tg-series-list">
		<?php foreach ( $tg_series_query->posts as $tg_sp ) : ?>
			<?php
			$tg_sp_id   = (int) $tg_sp->ID;
			$tg_is_curr = ( $tg_sp_id === $tg_pid );
			?>
			<li class="tg-series-item<?php echo $tg_is_curr ? ' is-current' : ''; ?>">
				<span class="tg-series-dot" aria-hidden="true"></span>
				<div class="tg-series-item-body">
					<span class="tg-series-date">
						<?php echo esc_html( get_the_date( 'd/m/Y', $tg_sp_id ) ); ?>
						<?php if ( $tg_is_curr ) : ?>
							<strong class="tg-series-now"><?php esc_html_e( '· Lendo agora', 'teoriageek' ); ?></strong>
						<?php endif; ?>
					</span>
					<?php if ( $tg_is_curr ) : ?>
						<span class="tg-series-link is-current">
							<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_sp_id ) ) ); ?>
						</span>
					<?php else : ?>
						<a href="<?php echo esc_url( get_permalink( $tg_sp_id ) ); ?>" class="tg-series-link">
							<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_sp_id ) ) ); ?>
						</a>
					<?php endif; ?>
				</div>
			</li>
		<?php endforeach; ?>
	</ol>
</section>
