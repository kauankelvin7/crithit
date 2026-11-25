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
?>
<aside aria-label="<?php esc_attr_e( 'Nota da avaliação editorial', 'teoriageek' ); ?>" class="my-8 overflow-hidden rounded-lg border-2 border-[#0B0F19] bg-highlight p-5 text-[#0B0F19] shadow-hard sm:p-6">
	<div class="flex flex-col gap-5 sm:flex-row sm:items-center">
		<div class="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-[#0B0F19] bg-[#0B0F19] text-highlight shadow-hard-sm">
			<span class="font-display text-4xl leading-none"><?php echo esc_html( $tg_score ); ?></span>
			<span class="mt-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">/ 10</span>
		</div>

		<div class="min-w-0 flex-1 space-y-2.5">
			<div class="flex flex-wrap items-center gap-2">
				<span class="inline-flex items-center gap-1 rounded bg-[#0B0F19] px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-highlight">
					<?php echo teoriageek_icon( 'award', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					<?php echo esc_html( sprintf( __( 'Veredito %s', 'teoriageek' ), $tg_fmt['label'] ) ); ?>
				</span>
				<span class="font-mono text-xs font-bold uppercase text-[#0B0F19]">
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

			<div class="h-3 w-full overflow-hidden rounded-full border-2 border-[#0B0F19] bg-white/75" role="progressbar" aria-valuenow="<?php echo esc_attr( $tg_score ); ?>" aria-valuemin="0" aria-valuemax="10" aria-label="<?php esc_attr_e( 'Barra de pontuação de 0 a 10', 'teoriageek' ); ?>">
				<div class="h-full bg-brand-fill" style="width: <?php echo esc_attr( (string) $tg_pct ); ?>%;"></div>
			</div>
		</div>
	</div>

	<?php if ( ! empty( $tg_details['criteria'] ) ) : ?>
		<ul class="mt-5 grid gap-2.5 border-t-2 border-[#0B0F19]/20 pt-4 sm:grid-cols-2">
			<?php foreach ( $tg_details['criteria'] as $tg_crit ) : ?>
				<li class="flex items-center justify-between gap-2 rounded border border-[#0B0F19]/30 bg-white/55 px-3 py-1.5 font-mono text-xs font-bold text-[#0B0F19]">
					<span><?php echo esc_html( $tg_crit['label'] ); ?></span>
					<span><?php echo esc_html( $tg_crit['score'] ); ?>/10</span>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>
</aside>
