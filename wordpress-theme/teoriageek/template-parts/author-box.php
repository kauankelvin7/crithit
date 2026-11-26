<?php
/**
 * Template Part: Box do Autor na matéria (avatar, biografia e link para arquivo).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_author_id   = (int) get_the_author_meta( 'ID' );
$tg_author_name = get_the_author_meta( 'display_name', $tg_author_id );
$tg_author_bio  = trim( (string) get_the_author_meta( 'description', $tg_author_id ) );
$tg_author_url  = get_author_posts_url( $tg_author_id );
$tg_avatar_url  = get_avatar_url( $tg_author_id, array( 'size' => 128 ) );
$tg_author_web  = teoriageek_safe_http_url( (string) get_the_author_meta( 'user_url', $tg_author_id ) );
?>
<section aria-label="<?php esc_attr_e( 'Sobre o autor', 'teoriageek' ); ?>" class="mt-8 rounded-sm border border-border-subtle bg-surface-alt p-5">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
		<a href="<?php echo esc_url( $tg_author_url ); ?>" class="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border-subtle bg-brand-fill">
			<?php if ( $tg_avatar_url ) : ?>
				<img src="<?php echo esc_url( $tg_avatar_url ); ?>" alt="<?php echo esc_attr( $tg_author_name ); ?>" width="64" height="64" loading="lazy" decoding="async" class="h-full w-full object-cover" />
			<?php else : ?>
				<span class="flex h-full w-full items-center justify-center font-display text-2xl text-white">
					<?php echo esc_html( mb_strtoupper( mb_substr( $tg_author_name, 0, 1 ) ) ); ?>
				</span>
			<?php endif; ?>
		</a>

		<div class="min-w-0 flex-1 space-y-1.5">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div>
					<span class="block font-mono text-[11px] font-bold uppercase tracking-wider text-brand">
						<?php esc_html_e( 'Redação Teoria Geek', 'teoriageek' ); ?>
					</span>
					<h2 class="font-headline text-2xl font-extrabold uppercase tracking-tight text-ink-primary">
						<a href="<?php echo esc_url( $tg_author_url ); ?>" class="hover:text-brand">
							<?php echo esc_html( $tg_author_name ); ?>
						</a>
					</h2>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<?php if ( '' !== $tg_author_web ) : ?>
						<a href="<?php echo esc_url( $tg_author_web ); ?>" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-[40px] items-center gap-1 rounded-sm border border-border-subtle bg-surface px-3 py-1.5 font-sans text-xs font-bold text-ink-secondary hover:border-brand hover:text-brand">
							<?php echo teoriageek_icon( 'external', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<span><?php esc_html_e( 'Perfil', 'teoriageek' ); ?></span>
						</a>
					<?php endif; ?>
					<a href="<?php echo esc_url( $tg_author_url ); ?>" class="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-border-subtle bg-surface px-3 py-1.5 font-sans text-xs font-bold text-ink-primary hover:border-brand hover:text-brand">
						<span><?php esc_html_e( 'Ver matérias', 'teoriageek' ); ?></span>
						<?php echo teoriageek_icon( 'arrow-right', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
					</a>
				</div>
			</div>

			<p class="font-reading text-sm leading-relaxed text-ink-secondary">
				<?php
				if ( '' !== $tg_author_bio ) {
					echo esc_html( $tg_author_bio );
				} else {
					echo esc_html( sprintf( __( 'Integrante da equipe editorial do %s, com cobertura dedicada de cultura pop, games, cinema, séries e literatura geek.', 'teoriageek' ), get_bloginfo( 'name' ) ?: 'Teoria Geek' ) );
				}
				?>
			</p>
		</div>
	</div>
</section>
