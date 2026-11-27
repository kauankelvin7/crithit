<?php
/**
 * Template Part: Captura leve de Newsletter editorial (1 campo de e-mail).
 * Renderiza apenas quando a URL de envio (`teoriageek_newsletter_action_url`) está configurada no Personalizador,
 * compatível com MailerLite, Brevo, Substack ou endpoint próprio, sem dependências JS externas.
 *
 * @package TeoriaGeek
 * @var array $args { variant?: 'article'|'footer' }
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$tg_action = teoriageek_safe_http_url( (string) get_theme_mod( 'teoriageek_newsletter_action_url', '' ) );
if ( '' === $tg_action ) {
	return;
}

$tg_variant = ( isset( $args['variant'] ) && 'footer' === $args['variant'] ) ? 'footer' : 'article';
$tg_field   = sanitize_text_field( (string) get_theme_mod( 'teoriageek_newsletter_email_field', 'email' ) );
if ( '' === $tg_field ) {
	$tg_field = 'email';
}
$tg_title = (string) get_theme_mod( 'teoriageek_newsletter_title', __( 'Resumo Semanal Teoria Geek', 'teoriageek' ) );
$tg_desc  = (string) get_theme_mod( 'teoriageek_newsletter_desc', __( 'Uma curadoria por semana com as melhores críticas, trailers e guias — sem spam.', 'teoriageek' ) );
$tg_input_id = 'tg-newsletter-email-' . $tg_variant;
?>
<section aria-label="<?php esc_attr_e( 'Assinar newsletter do Teoria Geek', 'teoriageek' ); ?>" class="tg-newsletter-box tg-newsletter-box--<?php echo esc_attr( $tg_variant ); ?>">
	<div class="tg-newsletter-copy">
		<span class="tg-newsletter-badge"><?php esc_html_e( 'Newsletter', 'teoriageek' ); ?></span>
		<h3 class="tg-newsletter-title"><?php echo esc_html( $tg_title ); ?></h3>
		<p class="tg-newsletter-desc"><?php echo esc_html( $tg_desc ); ?></p>
	</div>
	<form action="<?php echo esc_url( $tg_action ); ?>" method="post" target="_blank" rel="noopener noreferrer" class="tg-newsletter-form">
		<label for="<?php echo esc_attr( $tg_input_id ); ?>" class="sr-only">
			<?php esc_html_e( 'Seu melhor e-mail', 'teoriageek' ); ?>
		</label>
		<input
			id="<?php echo esc_attr( $tg_input_id ); ?>"
			type="email"
			name="<?php echo esc_attr( $tg_field ); ?>"
			required
			autocomplete="email"
			placeholder="<?php esc_attr_e( 'seu@email.com', 'teoriageek' ); ?>"
			class="tg-newsletter-input"
		/>
		<button type="submit" class="tg-newsletter-btn">
			<?php esc_html_e( 'Assinar', 'teoriageek' ); ?>
		</button>
	</form>
</section>
