<?php
/**
 * Template Part: Paginação editorial acessível.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_links = paginate_links(
	array(
		'type'      => 'array',
		'mid_size'  => 2,
		'prev_text' => __( 'Anterior', 'teoriageek' ),
		'next_text' => __( 'Próxima', 'teoriageek' ),
	)
);

if ( empty( $tg_links ) ) {
	return;
}
?>
<nav aria-label="<?php esc_attr_e( 'Paginação de matérias', 'teoriageek' ); ?>" class="mt-10 flex flex-wrap items-center justify-center gap-2">
	<?php foreach ( $tg_links as $tg_link ) : ?>
		<?php $tg_is_current = ( false !== strpos( $tg_link, 'current' ) ); ?>
		<span class="tg-page-link <?php echo $tg_is_current ? 'is-current' : ''; ?>">
			<?php echo wp_kses_post( $tg_link ); ?>
		</span>
	<?php endforeach; ?>
</nav>
