<?php
/**
 * Rodapé institucional do tema Teoria Geek + Modais globais.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_is_reels  = teoriageek_is_reels_page();
$tg_site_name = (string) get_theme_mod( 'teoriageek_site_name', get_bloginfo( 'name' ) ?: 'Teoria Geek' );
$tg_socials   = teoriageek_get_social_links();

$tg_footer_cats = array();
foreach ( array( 'noticias', 'games', 'filmes', 'series', 'animes-mangas', 'livros-hqs', 'criticas', 'reviews', 'especial-teoria-geek' ) as $tg_f_slug ) {
	$tg_term = get_category_by_slug( $tg_f_slug );
	if ( $tg_term && ! is_wp_error( $tg_term ) ) {
		$tg_footer_cats[] = $tg_term;
	}
}

$tg_inst_pages = array();
foreach ( array( 'contato', 'saiba-como-anunciar-com-o-tg', 'venhaparaotg', 'politica-de-privacidade' ) as $tg_page_slug ) {
	$tg_p = get_page_by_path( $tg_page_slug );
	if ( $tg_p instanceof WP_Post && 'publish' === $tg_p->post_status ) {
		$tg_inst_pages[] = $tg_p;
	}
}
?>

<?php if ( ! $tg_is_reels ) : ?>
	<footer data-chrome="dark" class="mt-auto pt-14">
		<div class="border-t-4 border-highlight bg-chrome text-chrome-ink">
			<div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-12">
				<div class="space-y-3.5 md:col-span-5">
					<div class="flex flex-wrap items-center gap-3">
						<?php $tg_footer_logo = teoriageek_get_brand_logo_url( 'header' ); ?>
						<?php if ( '' !== $tg_footer_logo ) : ?>
							<a href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php echo esc_attr( $tg_site_name ); ?>" class="inline-flex shrink-0">
								<img src="<?php echo esc_url( $tg_footer_logo ); ?>" alt="<?php echo esc_attr( $tg_site_name ); ?>" width="300" height="190" loading="lazy" decoding="async" class="h-14 w-auto object-contain" />
							</a>
						<?php else : ?>
							<span class="rounded border-2 border-highlight bg-brand-fill px-3 py-1 font-display text-2xl tracking-wider text-white">
								<?php echo esc_html( strtoupper( $tg_site_name ) ); ?>
							</span>
						<?php endif; ?>
						<span class="font-mono text-xs uppercase tracking-wider text-chrome-muted">
							<?php echo esc_html( get_bloginfo( 'description' ) ?: 'O Importante é se divertir!' ); ?>
						</span>
					</div>
					<p class="max-w-md font-reading text-sm leading-relaxed text-chrome-muted">
						<?php esc_html_e( 'Cobertura editorial diária de games, cinema, séries, animes, mangás, literatura geek, música e eventos. Críticas, reviews e colunas autorais feitas por apaixonados por cultura pop.', 'teoriageek' ); ?>
					</p>
					<div class="flex items-center gap-2 pt-1 font-mono text-xs text-chrome-muted">
						<span class="text-highlight"><?php echo teoriageek_icon( 'shield-check', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
						<span><?php esc_html_e( 'Jornalismo & entretenimento geek independente.', 'teoriageek' ); ?></span>
					</div>

					<?php if ( ! empty( $tg_socials ) ) : ?>
						<div class="flex flex-wrap items-center gap-2 pt-2">
							<?php foreach ( $tg_socials as $tg_soc ) : ?>
								<a href="<?php echo esc_url( $tg_soc['url'] ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr( $tg_soc['label'] ); ?>" class="inline-flex h-9 w-9 items-center justify-center rounded border border-white/20 bg-chrome-surface text-chrome-ink transition-colors hover:border-highlight hover:text-highlight">
									<?php echo teoriageek_icon( $tg_soc['icon'], 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</a>
							<?php endforeach; ?>
							<a href="<?php echo esc_url( get_bloginfo( 'rss2_url' ) ); ?>" aria-label="<?php esc_attr_e( 'Feed RSS do portal', 'teoriageek' ); ?>" class="inline-flex h-9 w-9 items-center justify-center rounded border border-white/20 bg-chrome-surface text-chrome-ink transition-colors hover:border-highlight hover:text-highlight">
								<?php echo teoriageek_icon( 'rss', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							</a>
						</div>
					<?php endif; ?>
				</div>

				<div class="space-y-3 md:col-span-4">
					<h2 class="font-headline text-lg font-bold uppercase tracking-wide text-highlight">
						<?php esc_html_e( 'Editorias', 'teoriageek' ); ?>
					</h2>
					<ul class="grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-sm">
						<?php foreach ( $tg_footer_cats as $tg_f_cat ) : ?>
							<li>
								<a href="<?php echo esc_url( get_category_link( $tg_f_cat->term_id ) ); ?>" class="text-chrome-muted transition-colors hover:text-highlight">
									<?php echo esc_html( html_entity_decode( $tg_f_cat->name, ENT_QUOTES, 'UTF-8' ) ); ?>
								</a>
							</li>
						<?php endforeach; ?>
					</ul>
				</div>

				<div class="space-y-3 md:col-span-3">
					<h2 class="font-headline text-lg font-bold uppercase tracking-wide text-highlight">
						<?php esc_html_e( 'Plataforma & Institucional', 'teoriageek' ); ?>
					</h2>
					<?php if ( has_nav_menu( 'footer' ) ) : ?>
						<?php
						wp_nav_menu(
							array(
								'theme_location' => 'footer',
								'container'      => false,
								'menu_class'     => 'space-y-2 font-sans text-sm text-chrome-muted',
								'depth'          => 1,
							)
						);
						?>
					<?php else : ?>
						<ul class="space-y-2 font-sans text-sm">
							<li>
								<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="text-chrome-muted transition-colors hover:text-highlight">
									<?php esc_html_e( 'Capa Editorial', 'teoriageek' ); ?>
								</a>
							</li>
							<li>
								<a href="<?php echo esc_url( teoriageek_get_reels_url() ); ?>" class="text-chrome-muted transition-colors hover:text-highlight">
									<?php esc_html_e( 'Teoria Geek Reels', 'teoriageek' ); ?>
								</a>
							</li>
							<?php foreach ( $tg_inst_pages as $tg_inst ) : ?>
								<li>
									<a href="<?php echo esc_url( get_permalink( $tg_inst->ID ) ); ?>" class="text-chrome-muted transition-colors hover:text-highlight">
										<?php echo esc_html( html_entity_decode( get_the_title( $tg_inst->ID ), ENT_QUOTES, 'UTF-8' ) ); ?>
									</a>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>

					<?php if ( is_active_sidebar( 'tg-footer-widgets' ) ) : ?>
						<div class="pt-3">
							<?php dynamic_sidebar( 'tg-footer-widgets' ); ?>
						</div>
					<?php endif; ?>
				</div>
			</div>

			<div class="border-t border-white/10 px-4 py-4">
				<div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 font-mono text-[11px] text-chrome-muted sm:flex-row">
					<p>
						<?php
						echo esc_html(
							sprintf(
								'© %1$s %2$s — %3$s',
								wp_date( 'Y' ),
								$tg_site_name,
								__( 'Todos os direitos reservados.', 'teoriageek' )
							)
						);
						?>
					</p>
					<p><?php echo esc_html( get_bloginfo( 'description' ) ?: 'O Importante é se divertir!' ); ?></p>
				</div>
			</div>
		</div>
	</footer>
<?php endif; ?>

<?php
get_template_part( 'template-parts/navigation-mobile' );
get_template_part( 'template-parts/search-modal' );
wp_footer();
?>
</body>
</html>
