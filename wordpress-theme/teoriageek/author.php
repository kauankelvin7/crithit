<?php
/**
 * Arquivo de Autor (author.php).
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
$tg_author_obj = get_queried_object();
$tg_author_id  = ( $tg_author_obj instanceof WP_User ) ? (int) $tg_author_obj->ID : (int) get_the_author_meta( 'ID' );
$tg_name       = ( $tg_author_obj instanceof WP_User ) ? $tg_author_obj->display_name : get_the_author();
$tg_bio        = trim( (string) get_the_author_meta( 'description', $tg_author_id ) );
$tg_avatar     = get_avatar_url( $tg_author_id, array( 'size' => 160 ) );
$tg_count      = count_user_posts( $tg_author_id, 'post', true );
?>

<main id="conteudo-principal" class="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
	<?php teoriageek_breadcrumb(); ?>

	<header class="mb-8 rounded-lg border-2 border-border-strong bg-surface p-6 shadow-hard sm:p-8">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-center">
			<div class="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-border-strong bg-brand-fill">
				<?php if ( $tg_avatar ) : ?>
					<img src="<?php echo esc_url( $tg_avatar ); ?>" alt="<?php echo esc_attr( $tg_name ); ?>" width="80" height="80" decoding="async" class="h-full w-full object-cover" />
				<?php endif; ?>
			</div>
			<div class="min-w-0 flex-1 space-y-2">
				<div class="flex flex-wrap items-center gap-2.5">
					<span class="rounded bg-brand-fill px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase text-white">
						<?php esc_html_e( 'Redação', 'teoriageek' ); ?>
					</span>
					<span class="font-mono text-xs text-ink-muted">
						<?php echo esc_html( sprintf( _n( '%s matéria publicada', '%s matérias publicadas', (int) $tg_count, 'teoriageek' ), number_format_i18n( (int) $tg_count ) ) ); ?>
					</span>
				</div>
				<h1 class="font-headline text-3xl font-extrabold uppercase tracking-tight text-ink-primary sm:text-5xl">
					<?php echo esc_html( $tg_name ); ?>
				</h1>
				<?php if ( '' !== $tg_bio ) : ?>
					<p class="max-w-3xl font-reading text-sm leading-relaxed text-ink-secondary sm:text-base">
						<?php echo esc_html( $tg_bio ); ?>
					</p>
				<?php endif; ?>
			</div>
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
		<div class="rounded-lg border-2 border-border-strong bg-surface p-10 text-center shadow-hard-sm">
			<p class="font-reading text-base text-ink-secondary"><?php esc_html_e( 'Este autor ainda não possui matérias publicadas.', 'teoriageek' ); ?></p>
		</div>
	<?php endif; ?>
</main>

<?php
get_footer();
