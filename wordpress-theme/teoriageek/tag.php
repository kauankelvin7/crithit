<?php
/**
 * Arquivo de Tag (tag.php).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
$tg_tag_obj = get_queried_object();
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php teoriageek_breadcrumb(); ?>

	<header class="mb-8 rounded-sm border border-border-subtle border-t-4 border-t-brand bg-surface p-4 sm:p-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-2.5">
				<span class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[#0B0F19] bg-highlight text-ink-highlight">
					<?php echo teoriageek_icon( 'tag', 'h-5 w-5' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</span>
				<div>
					<p class="font-mono text-xs font-bold uppercase tracking-widest text-brand">
						<?php esc_html_e( 'Tópico & Tag', 'teoriageek' ); ?>
					</p>
					<h1 class="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-4xl">
						#<?php echo esc_html( teoriageek_fix_mojibake( html_entity_decode( single_tag_title( '', false ), ENT_QUOTES, 'UTF-8' ) ) ); ?>
					</h1>
				</div>
			</div>
			<?php if ( $tg_tag_obj instanceof WP_Term ) : ?>
				<span class="rounded border border-border-subtle bg-surface-alt px-3 py-1 font-mono text-xs font-bold text-ink-secondary">
					<?php echo esc_html( sprintf( _n( '%s matéria', '%s matérias', (int) $tg_tag_obj->count, 'teoriageek' ), number_format_i18n( (int) $tg_tag_obj->count ) ) ); ?>
				</span>
			<?php endif; ?>
		</div>
	</header>

	<?php if ( have_posts() ) : ?>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part(
					'template-parts/card-article',
					null,
					array(
						'post'        => get_post(),
						'heading_tag' => 'h2',
					)
				);
			endwhile;
			?>
		</div>
		<?php teoriageek_pagination(); ?>
	<?php else : ?>
		<div class="rounded-sm border border-border-subtle bg-surface p-10 text-center">
			<p class="font-reading text-base text-ink-secondary"><?php esc_html_e( 'Nenhuma matéria encontrada para esta tag.', 'teoriageek' ); ?></p>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="tactile-btn mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#0B0F19] bg-highlight px-4 py-2 font-sans text-xs font-extrabold uppercase text-ink-highlight">
				<?php esc_html_e( 'Voltar para a capa', 'teoriageek' ); ?>
			</a>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
