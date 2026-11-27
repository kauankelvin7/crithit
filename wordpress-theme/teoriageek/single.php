<?php
/**
 * Leitor de Matéria Individual (single.php) — Teoria Geek.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php
	while ( have_posts() ) :
		the_post();

		$tg_pid        = (int) get_the_ID();
		$tg_cat        = teoriageek_get_primary_category( $tg_pid );
		$tg_cat_style  = teoriageek_get_category_style( $tg_cat ? $tg_cat->slug : 'noticias' );
		$tg_fmt        = teoriageek_get_post_format_badge( $tg_pid );
		$tg_score      = teoriageek_get_post_score( $tg_pid );
		$tg_read_mins  = teoriageek_get_reading_time( $tg_pid );
		$tg_views      = teoriageek_get_post_views( $tg_pid );
		$tg_author_id  = (int) get_the_author_meta( 'ID' );
		$tg_author     = get_the_author_meta( 'display_name', $tg_author_id );
		$tg_author_url = get_author_posts_url( $tg_author_id );
		$tg_avatar     = get_avatar_url( $tg_author_id, array( 'size' => 96 ) );
		$tg_ext_src    = teoriageek_get_external_source( $tg_pid );
		$tg_has_spoiler = (bool) get_post_meta( $tg_pid, '_tg_has_spoilers', true );
		$tg_bullets    = teoriageek_get_post_bullets( $tg_pid, true );
		$tg_tags       = get_the_tags( $tg_pid );
		$tg_most_read  = teoriageek_get_most_read_posts( 5, array( $tg_pid ) );
		$tg_sidebar_ad = teoriageek_get_ad_slot_markup( 'sidebar' );

		// Linha fina exibida apenas quando há excerpt explícito ou subtítulo legado distinto do título.
		$tg_raw_excerpt = trim( (string) get_post_field( 'post_excerpt', $tg_pid ) );
		$tg_td_settings = teoriageek_get_legacy_td_settings( $tg_pid );
		$tg_header_lead = '';
		if ( '' !== $tg_raw_excerpt ) {
			$tg_header_lead = teoriageek_strip_emojis( html_entity_decode( teoriageek_fix_mojibake( wp_strip_all_tags( strip_shortcodes( teoriageek_strip_ficha_tecnica( $tg_raw_excerpt ) ) ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		} elseif ( ! empty( $tg_td_settings['td_subtitle'] ) && is_string( $tg_td_settings['td_subtitle'] ) ) {
			$tg_header_lead = teoriageek_strip_emojis( html_entity_decode( teoriageek_fix_mojibake( wp_strip_all_tags( $tg_td_settings['td_subtitle'] ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		}

		$tg_universos = get_the_terms( $tg_pid, 'universo' );

		// JSON-LD NewsArticle / Review (com reviewRating) suprimido automaticamente quando plugin de SEO está ativo.
		if ( ! teoriageek_has_seo_plugin() ) :
			$tg_schema = teoriageek_build_single_schema( $tg_pid );
			?>
			<script type="application/ld+json"><?php echo wp_json_encode( $tg_schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ); ?></script>
		<?php endif; ?>

		<?php teoriageek_breadcrumb(); ?>

		<article id="post-<?php the_ID(); ?>" <?php post_class( 'space-y-8' ); ?>>
			<header class="rounded-lg border-2 border-border-strong bg-surface p-4 shadow-hard sm:p-8">
				<div class="mb-4 flex flex-wrap items-center gap-2.5">
					<?php teoriageek_category_badge( $tg_cat, true, 'md', true ); ?>
					<?php
					if ( $tg_cat ) {
						teoriageek_render_sponsor_badge( $tg_cat->slug );
					}
					?>
					<span class="rounded border border-border-subtle bg-surface-alt px-2.5 py-1 font-mono text-xs font-bold uppercase text-ink-secondary">
						<?php echo esc_html( $tg_fmt['label'] ); ?>
					</span>
					<?php if ( $tg_has_spoiler ) : ?>
						<span class="tg-card-spoiler-pill"><?php esc_html_e( 'Contém Spoilers', 'teoriageek' ); ?></span>
					<?php endif; ?>

					<?php if ( ! empty( $tg_universos ) && ! is_wp_error( $tg_universos ) ) : ?>
						<?php foreach ( array_slice( $tg_universos, 0, 2 ) as $tg_u_term ) : ?>
							<a href="<?php echo esc_url( get_term_link( $tg_u_term ) ); ?>" class="rounded border border-brand/40 bg-brand-soft px-2.5 py-0.5 font-mono text-xs font-bold uppercase text-brand hover:bg-brand-fill hover:text-white">
								<?php echo esc_html( $tg_u_term->name ); ?>
							</a>
						<?php endforeach; ?>
					<?php endif; ?>

					<?php if ( null !== $tg_score ) : ?>
						<span class="inline-flex items-center gap-1 rounded border-2 border-[#0B0F19] bg-highlight px-2.5 py-0.5 font-mono text-xs font-bold text-ink-highlight">
							<?php echo teoriageek_icon( 'star', 'h-3.5 w-3.5 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<?php echo esc_html( sprintf( __( 'Nota %s/10', 'teoriageek' ), $tg_score ) ); ?>
						</span>
					<?php endif; ?>

					<span class="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
						<?php echo teoriageek_icon( 'clock', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						<?php echo esc_html( sprintf( __( '%d min de leitura', 'teoriageek' ), $tg_read_mins ) ); ?>
					</span>

					<?php if ( $tg_views > 0 ) : ?>
						<span class="inline-flex items-center gap-1 font-mono text-xs text-ink-muted">
							<?php echo teoriageek_icon( 'eye', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
							<?php echo esc_html( sprintf( '%s leituras', teoriageek_format_compact( $tg_views ) ) ); ?>
						</span>
					<?php endif; ?>
				</div>

				<h1 class="font-headline text-2xl font-extrabold leading-[1.12] tracking-[0.005em] text-ink-primary sm:text-5xl">
					<?php echo esc_html( teoriageek_clean_title( get_the_title() ) ); ?>
				</h1>

				<?php if ( '' !== $tg_header_lead ) : ?>
					<p class="mt-4 max-w-4xl font-reading text-lg leading-relaxed text-ink-secondary sm:text-xl">
						<?php echo esc_html( $tg_header_lead ); ?>
					</p>
				<?php endif; ?>

				<div class="mt-6 flex flex-col gap-4 border-t border-border-subtle pt-5 lg:flex-row lg:items-center lg:justify-between">
					<div class="flex items-center gap-3">
						<a href="<?php echo esc_url( $tg_author_url ); ?>" class="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-border-strong bg-brand-fill">
							<?php if ( $tg_avatar ) : ?>
								<img src="<?php echo esc_url( $tg_avatar ); ?>" alt="<?php echo esc_attr( $tg_author ); ?>" width="48" height="48" decoding="async" class="h-full w-full object-cover" />
							<?php endif; ?>
						</a>
						<div class="space-y-1">
							<div class="flex flex-wrap items-center gap-2 font-mono text-xs">
								<span class="font-semibold text-ink-secondary"><?php esc_html_e( 'Por', 'teoriageek' ); ?></span>
								<a href="<?php echo esc_url( $tg_author_url ); ?>" class="font-bold text-ink-primary hover:text-brand hover:underline">
									<?php echo esc_html( $tg_author ); ?>
								</a>
								<?php if ( $tg_ext_src ) : ?>
									<span class="text-ink-muted">/</span>
									<?php if ( '' !== $tg_ext_src['url'] ) : ?>
										<a href="<?php echo esc_url( $tg_ext_src['url'] ); ?>" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
											<span><?php echo esc_html( sprintf( __( 'Fonte: %s', 'teoriageek' ), $tg_ext_src['name'] ) ); ?></span>
											<?php echo teoriageek_icon( 'external', 'h-3.5 w-3.5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
										</a>
									<?php else : ?>
										<span class="text-ink-muted"><?php echo esc_html( sprintf( __( 'Fonte: %s', 'teoriageek' ), $tg_ext_src['name'] ) ); ?></span>
									<?php endif; ?>
								<?php endif; ?>
							</div>

							<div class="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs text-ink-muted">
								<time datetime="<?php echo esc_attr( get_the_date( DATE_W3C ) ); ?>">
									<?php echo esc_html( get_the_date( 'd \d\e F \d\e Y \à\s H:i' ) ); ?>
								</time>
								<?php if ( ( (int) get_the_modified_time( 'U' ) - (int) get_the_time( 'U' ) ) > 3600 ) : ?>
									<span aria-hidden="true">·</span>
									<time datetime="<?php echo esc_attr( get_the_modified_date( DATE_W3C ) ); ?>" class="font-medium text-ink-secondary">
										<?php echo esc_html( sprintf( __( 'Atualizado em %s', 'teoriageek' ), get_the_modified_date( 'd/m/Y \à\s H:i' ) ) ); ?>
									</time>
								<?php endif; ?>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-2 overflow-x-auto">
						<div class="tgx-font-controls inline-flex shrink-0 items-center rounded-sm border border-border-subtle bg-surface-alt p-0.5" role="group" aria-label="<?php esc_attr_e( 'Tamanho do texto', 'teoriageek' ); ?>">
							<button type="button" data-tg-font-step="-1" aria-label="<?php esc_attr_e( 'Diminuir tamanho da fonte', 'teoriageek' ); ?>" class="tgx-font-btn">A-</button>
							<button type="button" data-tg-font-reset aria-label="<?php esc_attr_e( 'Restaurar tamanho padrão da fonte', 'teoriageek' ); ?>" title="<?php esc_attr_e( 'Restaurar tamanho padrão (100%)', 'teoriageek' ); ?>" class="tgx-font-indicator">100%</button>
							<button type="button" data-tg-font-step="1" aria-label="<?php esc_attr_e( 'Aumentar tamanho da fonte', 'teoriageek' ); ?>" class="tgx-font-btn">A+</button>
						</div>
					<?php
					get_template_part(
						'template-parts/share-buttons',
						null,
						array(
							'post_id' => $tg_pid,
							'compact' => true,
						)
					);
					?>
					</div>
				</div>
			</header>

			<div class="grid gap-8 lg:grid-cols-12">
				<div class="min-w-0 space-y-6 lg:col-span-8">
					<div id="tg-article-body" class="rounded-lg border-2 border-border-strong bg-surface p-4 shadow-hard sm:p-8">
						<figure class="mb-6 overflow-hidden rounded border-2 border-border-strong bg-surface-alt">
							<?php
							get_template_part(
								'template-parts/cover-media',
								null,
								array(
									'post_id'      => $tg_pid,
									'size'         => 'tg-hero',
									'aspect_class' => 'w-full aspect-[16/9] sm:h-[340px] lg:h-[390px]',
									'priority'     => true,
								)
							);
							$tg_thumb_caption = has_post_thumbnail( $tg_pid ) ? wp_get_attachment_caption( (int) get_post_thumbnail_id( $tg_pid ) ) : '';
							?>
							<?php if ( ! empty( $tg_thumb_caption ) ) : ?>
								<figcaption class="border-t border-border-subtle bg-surface-alt px-4 py-2 font-mono text-[11px] text-ink-secondary">
									<?php echo esc_html( $tg_thumb_caption ); ?>
								</figcaption>
							<?php endif; ?>
						</figure>

						<?php if ( ! empty( $tg_bullets ) ) : ?>
							<section aria-labelledby="tg-pontos-chave" class="mb-6 rounded-r border border-border-subtle border-l-4 bg-surface-alt p-4 sm:p-5" style="<?php echo esc_attr( 'border-left-color:' . $tg_cat_style['accent'] . ';' ); ?>">
								<div class="mb-3 flex items-center gap-2">
									<span style="<?php echo esc_attr( 'color:' . $tg_cat_style['accent'] . ';' ); ?>">
										<?php echo teoriageek_icon( 'list-checks', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
									</span>
									<h2 id="tg-pontos-chave" class="font-headline text-xl font-extrabold uppercase tracking-wide text-ink-primary">
										<?php esc_html_e( 'Em Resumo — Pontos-Chave', 'teoriageek' ); ?>
									</h2>
								</div>
								<ul class="list-disc space-y-2 pl-5 font-reading text-sm leading-relaxed text-ink-secondary sm:text-base">
									<?php foreach ( $tg_bullets as $tg_b ) : ?>
										<li><?php echo esc_html( $tg_b ); ?></li>
									<?php endforeach; ?>
								</ul>
							</section>
						<?php endif; ?>

						<?php if ( $tg_has_spoiler ) : ?>
							<div class="tg-spoiler-gate is-locked" data-tg-spoiler-gate>
								<div class="tg-spoiler-gate-card" role="region" aria-label="<?php esc_attr_e( 'Aviso de spoiler', 'teoriageek' ); ?>">
									<span class="tg-spoiler-tag"><?php esc_html_e( 'ALERTA DE SPOILER', 'teoriageek' ); ?></span>
									<p class="tg-spoiler-gate-msg"><?php esc_html_e( 'Esta matéria revela detalhes importantes da trama. Deseja continuar mesmo assim?', 'teoriageek' ); ?></p>
									<button type="button" data-tg-spoiler-unlock class="tg-spoiler-gate-btn">
										<?php esc_html_e( 'Clique aqui para ver o spoiler por sua conta e risco', 'teoriageek' ); ?>
									</button>
								</div>
						<?php endif; ?>
						<div class="entry-content font-reading text-base leading-[1.78] text-ink-primary sm:text-[17px]">
							<?php
							the_content();

							wp_link_pages(
								array(
									'before' => '<nav class="mt-6 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4 font-mono text-xs font-bold">' . esc_html__( 'Páginas:', 'teoriageek' ),
									'after'  => '</nav>',
								)
							);
							?>
						</div>
						<?php if ( $tg_has_spoiler ) : ?></div><?php endif; ?>

						<?php get_template_part( 'template-parts/review-card', null, array( 'post_id' => $tg_pid ) ); ?>

						<?php get_template_part( 'template-parts/series-timeline', null, array( 'post_id' => $tg_pid ) ); ?>

						<?php get_template_part( 'template-parts/article-reaction', null, array( 'post_id' => $tg_pid ) ); ?>

						<?php if ( ! empty( $tg_tags ) && ! is_wp_error( $tg_tags ) ) : ?>
							<div class="mt-8 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-5">
								<span class="text-ink-muted"><?php echo teoriageek_icon( 'tag', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
								<?php foreach ( $tg_tags as $tg_tag ) : ?>
									<a href="<?php echo esc_url( get_tag_link( $tg_tag->term_id ) ); ?>" class="rounded border border-border-subtle bg-surface-alt px-2.5 py-1 font-mono text-xs font-medium text-ink-secondary hover:border-brand hover:text-brand">
										#<?php echo esc_html( html_entity_decode( $tg_tag->name, ENT_QUOTES, 'UTF-8' ) ); ?>
									</a>
								<?php endforeach; ?>
							</div>
						<?php endif; ?>

						<div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5">
							<span class="font-mono text-xs font-bold uppercase tracking-wider text-ink-secondary">
								<?php esc_html_e( 'Compartilhe esta matéria:', 'teoriageek' ); ?>
							</span>
							<?php get_template_part( 'template-parts/share-buttons', null, array( 'post_id' => $tg_pid ) ); ?>
						</div>

						<?php get_template_part( 'template-parts/author-box' ); ?>

						<?php get_template_part( 'template-parts/newsletter-box', null, array( 'variant' => 'article' ) ); ?>
					</div>

					<?php
					// Fluxo editorial contínuo: Box do Autor -> Próxima Matéria -> Matérias Relacionadas -> Reels -> Canais -> Comentários.
					get_template_part( 'template-parts/next-article' );
					get_template_part( 'template-parts/related-posts' );
					get_template_part(
						'template-parts/reels-strip',
						null,
						array(
							'columns'    => 3,
							'auto_query' => true,
							'exclude_id' => $tg_pid,
							'heading_id' => 'tg-single-reels-heading',
						)
					);
					get_template_part( 'template-parts/community-cta' );

					if ( comments_open() || get_comments_number() ) {
						comments_template();
					}
					?>
				</div>

				<aside aria-label="<?php esc_attr_e( 'Ranking e conteúdo complementar', 'teoriageek' ); ?>" class="min-w-0 space-y-6 lg:sticky lg:top-[88px] lg:col-span-4 lg:self-start">
					<?php if ( ! empty( $tg_most_read ) ) : ?>
						<section aria-labelledby="tg-sidebar-mais-lidas" class="rounded-lg border border-border-subtle bg-surface p-4 shadow-sm">
							<div class="mb-3 flex items-center gap-2 border-b border-border-subtle pb-2.5">
								<span class="text-brand"><?php echo teoriageek_icon( 'flame', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
								<h2 id="tg-sidebar-mais-lidas" class="font-headline text-xl font-extrabold uppercase tracking-[0.005em] text-ink-primary">
									<?php esc_html_e( 'Mais Lidas Agora', 'teoriageek' ); ?>
								</h2>
							</div>

							<ol class="divide-y divide-border-subtle">
								<?php foreach ( $tg_most_read as $tg_idx => $tg_m_item ) : ?>
									<?php
									$tg_mi_id    = (int) $tg_m_item->ID;
									$tg_mi_cat   = teoriageek_get_primary_category( $tg_mi_id );
									$tg_mi_views = teoriageek_get_post_views( $tg_mi_id );
									?>
									<li class="flex items-start gap-3 py-2.5 first:pt-1 last:pb-1">
										<span class="w-7 shrink-0 font-display text-2xl leading-none text-brand">#<?php echo esc_html( (string) ( $tg_idx + 1 ) ); ?></span>
										<div class="min-w-0 flex-1 space-y-1">
											<div class="flex items-center justify-between gap-2">
												<?php teoriageek_category_badge( $tg_mi_cat, false, 'sm' ); ?>
												<?php if ( $tg_mi_views > 0 ) : ?>
													<span class="inline-flex items-center gap-1 font-mono text-[11px] text-ink-muted">
														<?php echo teoriageek_icon( 'trending', 'h-3 w-3' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
														<?php echo esc_html( teoriageek_format_compact( $tg_mi_views ) ); ?>
													</span>
												<?php endif; ?>
											</div>
											<a href="<?php echo esc_url( get_permalink( $tg_mi_id ) ); ?>" class="line-clamp-2 block font-sans text-sm font-bold leading-snug text-ink-primary hover:text-brand">
												<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_mi_id ) ) ); ?>
											</a>
										</div>
									</li>
								<?php endforeach; ?>
							</ol>
						</section>
					<?php endif; ?>

					<?php
					if ( '' !== $tg_sidebar_ad ) {
						echo $tg_sidebar_ad; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					}
					?>

					<div data-chrome="dark" class="overflow-hidden rounded-sm border border-border-subtle bg-chrome text-chrome-ink">
						<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
							<span class="inline-flex items-center gap-2 font-display text-lg tracking-wider text-highlight">
								<?php echo teoriageek_icon( 'film', 'h-4 w-4' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								<?php esc_html_e( 'ASSISTA EM REELS', 'teoriageek' ); ?>
							</span>
							<span class="font-mono text-[11px] font-bold uppercase text-chrome-muted">
								<?php esc_html_e( '3 Lâminas', 'teoriageek' ); ?>
							</span>
						</div>
						<a href="<?php echo esc_url( teoriageek_get_reels_url( get_post_field( 'post_name', $tg_pid ) ) ); ?>" class="group relative block aspect-[16/10] w-full overflow-hidden">
							<?php
							get_template_part(
								'template-parts/cover-media',
								null,
								array(
									'post_id'      => $tg_pid,
									'size'         => 'tg-card',
									'aspect_class' => 'h-full w-full',
									'decorative'   => true,
								)
							);
							?>
							<div class="absolute inset-0 z-20 flex flex-col justify-end p-4" style="background:linear-gradient(to top, rgba(8,11,18,0.95) 0%, rgba(8,11,18,0.75) 52%, rgba(8,11,18,0.18) 100%);">
								<div class="mb-1.5 flex items-center justify-between">
									<?php teoriageek_category_badge( $tg_cat, false, 'sm' ); ?>
									<span class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#0B0F19] bg-highlight text-ink-highlight">
										<?php echo teoriageek_icon( 'play', 'h-3.5 w-3.5 fill-current' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
									</span>
								</div>
								<p class="line-clamp-2 font-headline text-lg font-bold leading-tight text-white group-hover:text-highlight">
									<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_pid ) ) ); ?>
								</p>
							</div>
						</a>
					</div>
				</aside>
			</div>
		</article>
	<?php endwhile; ?>

</main>

<?php
get_footer();
