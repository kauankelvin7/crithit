<?php
/**
 * Template Part: Card Visual de Nota / Veredito Editorial em destaque Amarelo (--tg-accent)
 * com texto escuro de alto contraste (#0B0F19). Compatível com Ficha Editorial, metadados
 * `td_post_theme_settings` do Newspaper e selos oficiais do Teoria Geek.
 *
 * @package TeoriaGeek
 * @var array $args { post_id?: int }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_pid     = isset( $args['post_id'] ) ? (int) $args['post_id'] : (int) get_the_ID();
$tg_details = teoriageek_get_review_details( $tg_pid );

if ( null === $tg_details ) {
	return;
}

$tg_score   = $tg_details['score'];
$tg_num     = (float) $tg_score;
$tg_pct     = max( 5, min( 100, (int) round( $tg_num * 10 ) ) );
$tg_verdict = teoriageek_get_score_verdict( $tg_num );
$tg_fmt     = teoriageek_get_post_format_badge( $tg_pid );

// Quando o post legado já possui o selo visual (.div-selo / selo-teoria-geek) no corpo,
// exibe uma barra editorial compacta integrada para evitar duplicação de dois blocos gigantes de nota.
$tg_raw_content    = (string) get_post_field( 'post_content', $tg_pid );
$tg_has_legacy_selo = (bool) preg_match( '/\b(?:div-selo|selo-teoria-geek)\b/i', $tg_raw_content );
?>
<?php if ( $tg_has_legacy_selo && empty( $tg_details['criteria'] ) && '' === $tg_details['summary'] ) : ?>
	<aside aria-label="<?php esc_attr_e( 'Nota da avaliação editorial', 'teoriageek' ); ?>" class="my-6 flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-3 text-[#0B0F19]">
		<div class="flex items-center gap-3">
			<span class="inline-flex items-center gap-1 rounded-sm bg-[#0B0F19] px-2.5 py-1 font-display text-xl leading-none text-highlight">
				<?php echo esc_html( $tg_score ); ?><span class="font-mono text-[11px] text-white">/10</span>
			</span>
			<div>
				<span class="block font-sans text-[11px] font-bold uppercase tracking-wider text-[#0B0F19]/80">
					<?php echo esc_html( sprintf( __( 'Veredito %s', 'teoriageek' ), $tg_fmt['label'] ) ); ?>
				</span>
				<strong class="font-headline text-lg font-extrabold uppercase leading-none text-[#0B0F19]">
					<?php echo esc_html( $tg_verdict ); ?>
				</strong>
			</div>
		</div>
		<div class="h-2.5 w-full overflow-hidden rounded-sm border border-[#0B0F19] bg-white/80 sm:w-48" role="progressbar" aria-valuenow="<?php echo esc_attr( $tg_score ); ?>" aria-valuemin="0" aria-valuemax="10" aria-label="<?php esc_attr_e( 'Barra de pontuação de 0 a 10', 'teoriageek' ); ?>">
			<div class="h-full bg-brand-fill" style="width: <?php echo esc_attr( (string) $tg_pct ); ?>%;"></div>
		</div>
	</aside>
<?php else : ?>
<aside aria-label="<?php esc_attr_e( 'Nota da avaliação editorial', 'teoriageek' ); ?>" class="my-8 overflow-hidden rounded-sm border border-[#0B0F19] bg-highlight p-4 text-[#0B0F19] sm:p-6">
	<div class="flex flex-col gap-5 sm:flex-row sm:items-center">
		<div class="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-sm border border-[#0B0F19] bg-[#0B0F19] text-highlight">
			<span class="font-display text-4xl leading-none"><?php echo esc_html( $tg_score ); ?></span>
			<span class="mt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">/ 10</span>
		</div>

		<div class="min-w-0 flex-1 space-y-2.5">
			<div class="flex flex-wrap items-center gap-2">
				<span class="inline-flex items-center gap-1 rounded-sm bg-[#0B0F19] px-2.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-wider text-highlight">
					<?php echo teoriageek_icon( 'award', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<?php echo esc_html( sprintf( __( 'Veredito %s', 'teoriageek' ), $tg_fmt['label'] ) ); ?>
				</span>
				<span class="font-sans text-xs font-bold uppercase text-[#0B0F19]">
					<?php echo esc_html( get_bloginfo( 'name' ) ?: 'Teoria Geek' ); ?>
				</span>
			</div>

			<h3 class="font-headline text-2xl font-extrabold uppercase tracking-wide text-[#0B0F19] sm:text-3xl">
				<?php echo esc_html( $tg_verdict ); ?>
			</h3>

			<?php if ( '' !== $tg_details['summary'] ) : ?>
				<p class="font-reading text-sm font-medium leading-relaxed text-[#0B0F19]">
					<?php echo esc_html( $tg_details['summary'] ); ?>
				</p>
			<?php endif; ?>

			<div class="h-3 w-full overflow-hidden rounded-sm border border-[#0B0F19] bg-white/75" role="progressbar" aria-valuenow="<?php echo esc_attr( $tg_score ); ?>" aria-valuemin="0" aria-valuemax="10" aria-label="<?php esc_attr_e( 'Barra de pontuação de 0 a 10', 'teoriageek' ); ?>">
				<div class="h-full bg-brand-fill" style="width: <?php echo esc_attr( (string) $tg_pct ); ?>%;"></div>
			</div>
		</div>
	</div>

	<?php if ( ! empty( $tg_details['criteria'] ) ) : ?>
		<ul class="mt-5 grid gap-2.5 border-t border-[#0B0F19]/20 pt-4 sm:grid-cols-2">
			<?php foreach ( $tg_details['criteria'] as $tg_crit ) : ?>
				<li class="flex items-center justify-between gap-2 rounded-sm border border-[#0B0F19]/30 bg-white/55 px-3 py-1.5 font-sans text-xs font-bold text-[#0B0F19]">
					<span><?php echo esc_html( $tg_crit['label'] ); ?></span>
					<span><?php echo esc_html( $tg_crit['score'] ); ?>/10</span>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>
</aside>
<?php endif; ?>

<?php
$tg_comm       = teoriageek_get_community_score( $tg_pid );
$tg_comm_avg   = ( $tg_comm['count'] > 0 ) ? number_format( $tg_comm['average'], 1, '.', '' ) : '—';
$tg_comm_count = (int) $tg_comm['count'];
?>
<div class="tg-community-score" data-tg-community-score="<?php echo esc_attr( (string) $tg_pid ); ?>">
	<div class="tg-community-score-head">
		<div class="tg-community-score-info">
			<span class="tg-community-score-kicker"><?php esc_html_e( 'Nota da Comunidade', 'teoriageek' ); ?></span>
			<div class="tg-community-score-summary">
				<strong data-tg-cs-avg class="tg-community-score-val"><?php echo esc_html( $tg_comm_avg ); ?></strong><span class="tg-community-score-max">/10</span>
				<span data-tg-cs-meta class="tg-community-score-meta">
					<?php
					if ( $tg_comm_count > 0 ) {
						echo esc_html(
							sprintf(
								/* translators: %d: quantidade de votos */
								_n( '· %d voto', '· %d votos', $tg_comm_count, 'teoriageek' ),
								$tg_comm_count
							)
						);
					} else {
						esc_html_e( '· Seja o primeiro a dar sua nota', 'teoriageek' );
					}
					?>
				</span>
			</div>
		</div>
		<span data-tg-cs-feedback class="tg-community-score-feedback"><?php esc_html_e( 'Qual é a sua nota?', 'teoriageek' ); ?></span>
	</div>
	<div class="tg-community-score-buttons" role="group" aria-label="<?php esc_attr_e( 'Escolha sua nota de 1 a 10', 'teoriageek' ); ?>">
		<?php for ( $tg_n = 1; $tg_n <= 10; $tg_n++ ) : ?>
			<button type="button" data-tg-rate-btn="<?php echo esc_attr( (string) $tg_n ); ?>" class="tg-cs-btn">
				<?php echo esc_html( (string) $tg_n ); ?>
			</button>
		<?php endfor; ?>
	</div>
</div>
