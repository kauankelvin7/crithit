<?php
/**
 * Página Institucional Estática (page.php).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
	<?php
	while ( have_posts() ) :
		the_post();
		teoriageek_breadcrumb();
		?>
		<article id="post-<?php the_ID(); ?>" <?php post_class( 'rounded-lg border-2 border-border-strong bg-surface p-6 shadow-hard sm:p-10' ); ?>>
			<header class="mb-6 border-b-2 border-border-strong pb-4">
				<h1 class="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-5xl">
					<?php echo esc_html( html_entity_decode( get_the_title(), ENT_QUOTES, 'UTF-8' ) ); ?>
				</h1>
			</header>

			<div class="entry-content font-reading text-base leading-[1.78] text-ink-primary sm:text-[17px]">
				<?php
				ob_start();
				the_content();
				$tg_page_html = trim( (string) ob_get_clean() );

				if ( '' !== wp_strip_all_tags( $tg_page_html ) || false !== stripos( $tg_page_html, '<img' ) || false !== stripos( $tg_page_html, '<iframe' ) ) {
					echo $tg_page_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Saída nativa de the_content().
				} else {
					?>
					<p class="text-ink-secondary">
						<?php esc_html_e( 'Esta página institucional está em atualização editorial. Para falar com nossa redação ou explorar as últimas pautas, acesse a capa do portal.', 'teoriageek' ); ?>
					</p>
					<p class="mt-4">
						<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="tactile-btn inline-flex items-center gap-1.5 rounded border-2 border-border-strong bg-highlight px-4 py-2 font-mono text-xs font-bold uppercase text-ink-highlight no-underline shadow-hard-sm">
							<?php esc_html_e( 'Ir para a Capa do Teoria Geek', 'teoriageek' ); ?>
						</a>
					</p>
					<?php
				}
				?>
			</div>
		</article>
	<?php endwhile; ?>
</main>

<?php
get_footer();
