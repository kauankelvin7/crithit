<?php
/**
 * Página Individual de Quiz (`/quizzes/<slug>/` · `single-tg_quiz.php`) — Teoria Geek v2.13.0.
 *
 * Layout editorial enxuto focado na experiência do jogador e SEO:
 * Breadcrumb, H1, imagem destacada, introdução HTML indexável (`the_content()`) e player interativo.
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
	<?php
	while ( have_posts() ) :
		the_post();

		$tg_qid        = (int) get_the_ID();
		$tg_cat        = teoriageek_get_primary_category( $tg_qid );
		$tg_universos  = get_the_terms( $tg_qid, 'universo' );
		$tg_author_id  = (int) get_the_author_meta( 'ID' );
		$tg_raw_intro  = trim( (string) get_post_field( 'post_content', $tg_qid ) );
		$tg_raw_ex     = trim( (string) get_post_field( 'post_excerpt', $tg_qid ) );
		$tg_lead       = '' !== $tg_raw_ex ? teoriageek_strip_emojis( html_entity_decode( teoriageek_fix_mojibake( wp_strip_all_tags( strip_shortcodes( $tg_raw_ex ) ) ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) : '';
		?>

		<?php teoriageek_breadcrumb(); ?>

		<article id="post-<?php the_ID(); ?>" <?php post_class( 'tg-quiz-page space-y-6' ); ?>>
			<header class="tg-quiz-page__header">
				<div class="tg-quiz-page__badges">
					<span class="tg-quiz__kicker"><?php esc_html_e( 'Quiz · Trivia', 'teoriageek' ); ?></span>
					<?php if ( $tg_cat instanceof WP_Term ) : ?>
						<?php teoriageek_category_badge( $tg_cat, true, 'sm' ); ?>
					<?php endif; ?>
					<?php if ( ! empty( $tg_universos ) && ! is_wp_error( $tg_universos ) ) : ?>
						<?php foreach ( array_slice( $tg_universos, 0, 2 ) as $tg_u_term ) : ?>
							<a href="<?php echo esc_url( get_term_link( $tg_u_term ) ); ?>" class="tg-quiz-page__universe">
								<?php echo esc_html( $tg_u_term->name ); ?>
							</a>
						<?php endforeach; ?>
					<?php endif; ?>
				</div>

				<h1 class="tg-quiz-page__h1 font-headline text-2xl font-extrabold leading-[1.12] tracking-[0.005em] text-ink-primary sm:text-4xl">
					<?php echo esc_html( teoriageek_clean_title( get_the_title( $tg_qid ) ) ); ?>
				</h1>

				<?php if ( '' !== $tg_lead ) : ?>
					<p class="tg-quiz-page__lead font-reading text-base leading-relaxed text-ink-secondary sm:text-lg">
						<?php echo esc_html( $tg_lead ); ?>
					</p>
				<?php endif; ?>

				<div class="tg-quiz-page__meta">
					<?php teoriageek_render_author_chip( $tg_author_id, 24, true ); ?>
					<time datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $tg_qid ) ); ?>" class="tg-quiz-page__date">
						<?php echo esc_html( get_the_date( 'd/m/Y', $tg_qid ) ); ?>
					</time>
				</div>
			</header>

			<?php if ( has_post_thumbnail( $tg_qid ) ) : ?>
				<figure class="tg-quiz-page__figure overflow-hidden rounded-sm border border-border-subtle bg-surface-alt">
					<?php
					get_template_part(
						'template-parts/cover-media',
						null,
						array(
							'post_id'      => $tg_qid,
							'size'         => 'tg-hero',
							'aspect_class' => 'w-full aspect-[16/9]',
							'priority'     => true,
						)
					);
					$tg_thumb_caption = wp_get_attachment_caption( (int) get_post_thumbnail_id( $tg_qid ) );
					?>
					<?php if ( ! empty( $tg_thumb_caption ) ) : ?>
						<figcaption class="border-t border-border-subtle bg-surface-alt px-4 py-2 font-sans text-xs text-ink-secondary">
							<?php echo esc_html( $tg_thumb_caption ); ?>
						</figcaption>
					<?php endif; ?>
				</figure>
			<?php endif; ?>

			<?php if ( '' !== $tg_raw_intro ) : ?>
				<div class="tg-quiz-page__intro entry-content font-reading text-base leading-[1.78] text-ink-primary sm:text-[17px]">
					<?php the_content(); ?>
				</div>
			<?php endif; ?>

			<?php
			get_template_part(
				'template-parts/quiz-player',
				null,
				array(
					'quiz_id'      => $tg_qid,
					'mode'         => 'single',
					'host_post_id' => 0,
				)
			);
			?>
		</article>
	<?php endwhile; ?>
</main>

<?php
get_footer();
