<?php
/**
 * Teoria Geek — Motor de Analytics First-Party (v2.12.1).
 *
 * Telemetria editorial leve, 100% compatível com WP Super Cache e hospedagem compartilhada Locaweb,
 * sem cookies de rastreamento, sem PII (IPs nunca são gravados) e sem dependência externa.
 *
 * Coleta em lote via `POST /wp-json/teoriageek/v1/telemetry` (sem `X-WP-Nonce` para não quebrar
 * em páginas cacheadas por mais de 24h) e agrega em buckets diários compactos (retenção de 30 dias
 * em `teoriageek_analytics_days_v1` com `autoload = no`) + leitores ativos em janela de 5 minutos
 * (`teoriageek_live_visitors_v1`).
 *
 * Métricas fornecidas à Central Teoria Geek:
 * - Leitores online agora (5 min) e páginas lidas ao vivo
 * - Visualizações, sessões, páginas/sessão, taxa de rejeição (bounce rate) e tempo ativo médio
 * - Mapa de cliques por zona do portal (onde o público mais clica) e top 15 links/botões clicados
 * - Conversões editoriais (WhatsApp, Telegram, Google Notícias, Newsletter, Compartilhamento, Spoiler, YouTube, Reels, Curtidas, Votos, Links externos)
 * - Origens de tráfego (Referrers), top domínios externos e campanhas UTM
 * - Dispositivos (Mobile, Desktop, Tablet) e tipos de página
 * - Distribuição horária (00h–23h) e funil de profundidade de leitura (Scroll Depth 25%–100%)
 * - Top páginas mais acessadas e termos mais buscados (destacando buscas com 0 resultados)
 *
 * @package TeoriaGeek
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TEORIAGEEK_ANALYTICS_OPTION', 'teoriageek_analytics_days_v1' );
define( 'TEORIAGEEK_ANALYTICS_LIVE_TRANSIENT', 'teoriageek_live_visitors_v1' );
define( 'TEORIAGEEK_ANALYTICS_RETENTION_DAYS', 30 );

/**
 * Rótulos editoriais oficiais das zonas de clique do portal.
 *
 * @return array<string, array{label:string,desc:string}>
 */
function teoriageek_analytics_zone_catalog() {
	return array(
		'hero_carousel'  => array(
			'label' => __( 'Carrossel Hero (Capa)', 'teoriageek' ),
			'desc'  => __( 'Manchete principal, slides e controles do topo da Home', 'teoriageek' ),
		),
		'hero_secondary' => array(
			'label' => __( 'Cards Secundários da Dobra', 'teoriageek' ),
			'desc'  => __( '3 cards abaixo do Hero e Radar na Redação', 'teoriageek' ),
		),
		'plantao_ticker' => array(
			'label' => __( 'Plantão Geek (Ticker)', 'teoriageek' ),
			'desc'  => __( 'Faixa deslizante de notícias urgentes no topo', 'teoriageek' ),
		),
		'header_nav'     => array(
			'label' => __( 'Cabeçalho & Menu de Editorias', 'teoriageek' ),
			'desc'  => __( 'Logotipo, menu principal, barra mobile e botão Reels', 'teoriageek' ),
		),
		'giro_geek'      => array(
			'label' => __( 'Giro Geek (Últimas)', 'teoriageek' ),
			'desc'  => __( 'Carrossel de últimas publicações na capa', 'teoriageek' ),
		),
		'mais_lidas'     => array(
			'label' => __( 'Mais Lidas (Home e Sidebar)', 'teoriageek' ),
			'desc'  => __( 'Ranking de matérias em alta 24h / 7 dias', 'teoriageek' ),
		),
		'criticas'       => array(
			'label' => __( 'Críticas, Reviews & Nota do Público', 'teoriageek' ),
			'desc'  => __( 'Bloco de análises e votação da comunidade', 'teoriageek' ),
		),
		'reels'          => array(
			'label' => __( 'Reels & Faixa Vertical', 'teoriageek' ),
			'desc'  => __( 'Card Reels em Destaque, faixa de Reels e player /reels/', 'teoriageek' ),
		),
		'especiais'      => array(
			'label' => __( 'Especiais & Colunas', 'teoriageek' ),
			'desc'  => __( 'Seção de artigos aprofundados e bastidores', 'teoriageek' ),
		),
		'editorias_home' => array(
			'label' => __( 'Colunas de Editorias (Capa)', 'teoriageek' ),
			'desc'  => __( 'Blocos por categoria (Games, Cinema, Séries, Animes, HQs)', 'teoriageek' ),
		),
		'leia_tambem'    => array(
			'label' => __( 'Leia Também (No Texto)', 'teoriageek' ),
			'desc'  => __( 'Sugestão automática inserida no meio das matérias', 'teoriageek' ),
		),
		'relacionados'   => array(
			'label' => __( 'Próxima Matéria & Relacionados', 'teoriageek' ),
			'desc'  => __( 'Continuação de leitura ao final do artigo', 'teoriageek' ),
		),
		'universo'       => array(
			'label' => __( 'Cobertura por Universo', 'teoriageek' ),
			'desc'  => __( 'Selos de franquia e linha do tempo de especiais', 'teoriageek' ),
		),
		'canais_sociais' => array(
			'label' => __( 'Canais Oficiais & Redes', 'teoriageek' ),
			'desc'  => __( 'WhatsApp, Telegram, Google Notícias e ícones sociais', 'teoriageek' ),
		),
		'compartilhar'   => array(
			'label' => __( 'Barra de Compartilhamento', 'teoriageek' ),
			'desc'  => __( 'Botões de enviar, WhatsApp, X e copiar link', 'teoriageek' ),
		),
		'newsletter'     => array(
			'label' => __( 'Newsletter Editorial', 'teoriageek' ),
			'desc'  => __( 'Caixa de assinatura semanal no artigo e rodapé', 'teoriageek' ),
		),
		'busca_alertas'  => array(
			'label' => __( 'Busca Instantânea & Alertas', 'teoriageek' ),
			'desc'  => __( 'Resultados do modal de busca e gaveta do sininho', 'teoriageek' ),
		),
		'corpo_artigo'   => array(
			'label' => __( 'Links no Corpo da Matéria', 'teoriageek' ),
			'desc'  => __( 'Links editoriais internos, tags, sumário e vídeos no texto', 'teoriageek' ),
		),
		'listagem'       => array(
			'label' => __( 'Arquivos, Categorias & Busca', 'teoriageek' ),
			'desc'  => __( 'Cards de listagem em editorias, tags, autores e resultados', 'teoriageek' ),
		),
		'rodape'         => array(
			'label' => __( 'Rodapé Institucional', 'teoriageek' ),
			'desc'  => __( 'Links de editorias, institucional e comunidade no footer', 'teoriageek' ),
		),
		'links_externos' => array(
			'label' => __( 'Links Externos (Saída)', 'teoriageek' ),
			'desc'  => __( 'Cliques para sites, fontes e trailers fora do domínio', 'teoriageek' ),
		),
		'outros'         => array(
			'label' => __( 'Outros Elementos', 'teoriageek' ),
			'desc'  => __( 'Demais links e botões interativos da página', 'teoriageek' ),
		),
	);
}

/**
 * Rótulos e cores dos canais de origem (Referrers).
 *
 * @return array<string, array{label:string,color:string}>
 */
function teoriageek_analytics_referrer_catalog() {
	return array(
		'direct'       => array( 'label' => __( 'Acesso Direto', 'teoriageek' ), 'color' => '#0073E6' ),
		'google'       => array( 'label' => __( 'Google (Busca Orgânica)', 'teoriageek' ), 'color' => '#34D399' ),
		'gnews'        => array( 'label' => __( 'Google Notícias / Discover', 'teoriageek' ), 'color' => '#FACC15' ),
		'instagram'    => array( 'label' => __( 'Instagram', 'teoriageek' ), 'color' => '#F472B6' ),
		'whatsapp'     => array( 'label' => __( 'WhatsApp', 'teoriageek' ), 'color' => '#22C55E' ),
		'x'            => array( 'label' => __( 'X / Twitter', 'teoriageek' ), 'color' => '#94A3B8' ),
		'facebook'     => array( 'label' => __( 'Facebook', 'teoriageek' ), 'color' => '#3B82F6' ),
		'youtube'      => array( 'label' => __( 'YouTube', 'teoriageek' ), 'color' => '#EF4444' ),
		'telegram'     => array( 'label' => __( 'Telegram', 'teoriageek' ), 'color' => '#38BDF8' ),
		'search_other' => array( 'label' => __( 'Bing / Yahoo / DuckDuckGo', 'teoriageek' ), 'color' => '#A78BFA' ),
		'other'        => array( 'label' => __( 'Outros Sites & Portais', 'teoriageek' ), 'color' => '#FB923C' ),
	);
}

/**
 * Rótulos e cores dos eventos de conversão e engajamento.
 *
 * @return array<string, array{label:string,color:string}>
 */
function teoriageek_analytics_conversion_catalog() {
	return array(
		'whatsapp'       => array( 'label' => __( 'Cliques no WhatsApp', 'teoriageek' ), 'color' => '#22C55E' ),
		'telegram'       => array( 'label' => __( 'Cliques no Telegram', 'teoriageek' ), 'color' => '#38BDF8' ),
		'gnews'          => array( 'label' => __( 'Google Notícias', 'teoriageek' ), 'color' => '#FACC15' ),
		'newsletter'     => array( 'label' => __( 'Inscrições Newsletter', 'teoriageek' ), 'color' => '#0073E6' ),
		'share'          => array( 'label' => __( 'Compartilhamentos', 'teoriageek' ), 'color' => '#A78BFA' ),
		'spoiler'        => array( 'label' => __( 'Spoilers Revelados', 'teoriageek' ), 'color' => '#F59E0B' ),
		'youtube'        => array( 'label' => __( 'Plays no YouTube', 'teoriageek' ), 'color' => '#EF4444' ),
		'reels_play'     => array( 'label' => __( 'Cliques em Reels', 'teoriageek' ), 'color' => '#EC4899' ),
		'like'           => array( 'label' => __( 'Curtidas em Matérias', 'teoriageek' ), 'color' => '#FB7185' ),
		'community_vote' => array( 'label' => __( 'Votos em Críticas', 'teoriageek' ), 'color' => '#14B8A6' ),
		'outbound'       => array( 'label' => __( 'Saídas p/ Links Externos', 'teoriageek' ), 'color' => '#94A3B8' ),
	);
}

/**
 * Estrutura vazia de um bucket diário de Analytics.
 *
 * @return array<string, mixed>
 */
function teoriageek_analytics_empty_day() {
	return array(
		'pv'       => 0,
		'sess'     => 0,
		'bounces'  => 0,
		'clk'      => 0,
		'eng_s'    => 0,
		'eng_n'    => 0,
		'hours'    => array_fill( 0, 24, 0 ),
		'dev'      => array(
			'mobile'  => 0,
			'desktop' => 0,
			'tablet'  => 0,
		),
		'types'    => array(),
		'refs'     => array(),
		'ref_dom'  => array(),
		'zones'    => array(),
		'clicks'   => array(),
		'pages'    => array(),
		'scroll'   => array(
			'base' => 0,
			'p25'  => 0,
			'p50'  => 0,
			'p75'  => 0,
			'p100' => 0,
		),
		'conv'     => array(),
		'searches' => array(),
		'utm'      => array(),
	);
}

/**
 * Identifica User-Agents de bots, crawlers e monitores conhecidos.
 *
 * @param string $ua User-Agent bruto.
 * @return bool True se for bot conhecido.
 */
function teoriageek_analytics_is_bot_ua( $ua ) {
	$ua = strtolower( trim( (string) $ua ) );
	if ( '' === $ua ) {
		return true;
	}
	return 1 === preg_match(
		'/(googlebot|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|facebookexternalhit|ia_archiver|applebot|twitterbot|linkedinbot|whatsapp\/|telegrambot|discordbot|pinterest|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|oai-searchbot|perplexitybot|ccbot|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|curl\/|wget\/|python-requests|python-urllib|scrapy|go-http-client|java\/|libwww|nikto)/i',
		$ua
	);
}

/**
 * Classifica o domínio de referência (referrer) em canal editorial padronizado.
 *
 * @param string $ref_url  URL do document.referrer (opcional).
 * @param string $utm_src  Parâmetro utm_source (opcional).
 * @return array{channel:string,domain:string}
 */
function teoriageek_analytics_classify_referrer( $ref_url, $utm_src = '' ) {
	$own_host = strtolower( (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ) );
	$own_root = preg_replace( '/^www\./', '', $own_host );

	$utm_low = strtolower( trim( (string) $utm_src ) );
	$host    = '';
	$path    = '';

	if ( '' !== trim( (string) $ref_url ) ) {
		$parsed = wp_parse_url( $ref_url );
		if ( is_array( $parsed ) && ! empty( $parsed['host'] ) ) {
			$host = strtolower( preg_replace( '/^www\./', '', (string) $parsed['host'] ) );
			$path = strtolower( (string) ( $parsed['path'] ?? '' ) );
		}
	}

	// Referrer interno do próprio domínio sem UTM conta como navegação interna (não sobrescreve origem direta).
	if ( '' !== $host && '' !== $own_root && ( $host === $own_root || str_ends_with( $host, '.' . $own_root ) ) ) {
		$host = '';
	}

	$probe = '' !== $utm_low ? $utm_low : $host;
	if ( '' === $probe ) {
		return array( 'channel' => 'direct', 'domain' => '' );
	}

	if ( false !== strpos( $probe, 'news.google' ) || false !== strpos( $probe, 'discover' ) || 'gnews' === $utm_low || 'google_news' === $utm_low || ( false !== strpos( $host, 'google.' ) && false !== strpos( $path, '/news' ) ) ) {
		return array( 'channel' => 'gnews', 'domain' => $host );
	}
	if ( false !== strpos( $probe, 'google' ) ) {
		return array( 'channel' => 'google', 'domain' => $host );
	}
	if ( false !== strpos( $probe, 'instagram' ) || 'ig' === $utm_low ) {
		return array( 'channel' => 'instagram', 'domain' => $host );
	}
	if ( false !== strpos( $probe, 'whatsapp' ) || false !== strpos( $probe, 'wa.me' ) || 'wa' === $utm_low ) {
		return array( 'channel' => 'whatsapp', 'domain' => $host );
	}
	if ( 't.co' === $host || false !== strpos( $probe, 'twitter' ) || 'x.com' === $host || 'x' === $utm_low ) {
		return array( 'channel' => 'x', 'domain' => $host );
	}
	if ( false !== strpos( $probe, 'facebook' ) || 'fb.com' === $host || 'm.facebook.com' === $host || 'fb' === $utm_low ) {
		return array( 'channel' => 'facebook', 'domain' => $host );
	}
	if ( false !== strpos( $probe, 'youtube' ) || 'youtu.be' === $host || 'yt' === $utm_low ) {
		return array( 'channel' => 'youtube', 'domain' => $host );
	}
	if ( false !== strpos( $probe, 'telegram' ) || 't.me' === $host || 'tg' === $utm_low ) {
		return array( 'channel' => 'telegram', 'domain' => $host );
	}
	if ( false !== strpos( $probe, 'bing' ) || false !== strpos( $probe, 'duckduckgo' ) || false !== strpos( $probe, 'yahoo' ) || false !== strpos( $probe, 'ecosia' ) ) {
		return array( 'channel' => 'search_other', 'domain' => $host );
	}

	return array( 'channel' => 'other', 'domain' => $host );
}

/**
 * Normaliza caminho de URL para chave estável de página.
 *
 * @param string $raw_path Caminho recebido do cliente.
 * @return string
 */
function teoriageek_analytics_norm_path( $raw_path ) {
	$path = trim( (string) $raw_path );
	if ( '' === $path ) {
		return '/';
	}
	if ( 0 === strpos( $path, 'http://' ) || 0 === strpos( $path, 'https://' ) ) {
		$parsed = wp_parse_url( $path );
		$path   = is_array( $parsed ) && ! empty( $parsed['path'] ) ? (string) $parsed['path'] : '/';
	}
	$qpos = strpos( $path, '?' );
	if ( false !== $qpos ) {
		$path = substr( $path, 0, $qpos );
	}
	$hpos = strpos( $path, '#' );
	if ( false !== $hpos ) {
		$path = substr( $path, 0, $hpos );
	}
	$path = '/' . ltrim( sanitize_text_field( $path ), '/' );
	$path = preg_replace( '#/+#', '/', $path );
	if ( strlen( $path ) > 140 ) {
		$path = substr( $path, 0, 140 );
	}
	return $path;
}

/**
 * Mantém um mapa associativo limitado às $max entradas com maior valor numérico (evita crescimento ilimitado no banco).
 *
 * @param array<string, int> $map Mapa chave => contagem.
 * @param int                $max Limite máximo de chaves.
 * @return array<string, int>
 */
function teoriageek_analytics_cap_int_map( array $map, $max ) {
	if ( count( $map ) <= $max ) {
		return $map;
	}
	arsort( $map, SORT_NUMERIC );
	return array_slice( $map, 0, $max, true );
}

/**
 * Mantém um mapa de objetos com campo de contagem limitado às $max maiores entradas.
 *
 * @param array<string, array<string, mixed>> $map       Mapa chave => registro.
 * @param string                              $count_key Chave numérica usada para ordenar.
 * @param int                                 $max       Limite máximo de registros.
 * @return array<string, array<string, mixed>>
 */
function teoriageek_analytics_cap_struct_map( array $map, $count_key, $max ) {
	if ( count( $map ) <= $max ) {
		return $map;
	}
	uasort(
		$map,
		static function ( $a, $b ) use ( $count_key ) {
			return (int) ( $b[ $count_key ] ?? 0 ) <=> (int) ( $a[ $count_key ] ?? 0 );
		}
	);
	return array_slice( $map, 0, $max, true );
}

/**
 * Registra presença anônima do leitor na janela de tempo real (5 minutos).
 *
 * @param string $sid    Identificador de sessão efêmero (sessionStorage).
 * @param string $path   Caminho normalizado da página atual.
 * @param string $device Dispositivo (mobile|desktop|tablet).
 */
function teoriageek_analytics_touch_live( $sid, $path, $device ) {
	if ( '' === $sid ) {
		return;
	}
	$now  = time();
	$day  = wp_date( 'Y-m-d' );
	$hash = substr( hash( 'sha256', $sid . '|' . $day . '|' . wp_salt( 'nonce' ) ), 0, 14 );
	$live = get_transient( TEORIAGEEK_ANALYTICS_LIVE_TRANSIENT );
	if ( ! is_array( $live ) ) {
		$live = array();
	}
	foreach ( $live as $k => $entry ) {
		if ( ! is_array( $entry ) || ( $now - (int) ( $entry['t'] ?? 0 ) ) > 300 ) {
			unset( $live[ $k ] );
		}
	}
	$live[ $hash ] = array(
		't' => $now,
		'p' => $path,
		'd' => $device,
	);
	if ( count( $live ) > 500 ) {
		uasort(
			$live,
			static function ( $a, $b ) {
				return (int) ( $b['t'] ?? 0 ) <=> (int) ( $a['t'] ?? 0 );
			}
		);
		$live = array_slice( $live, 0, 500, true );
	}
	set_transient( TEORIAGEEK_ANALYTICS_LIVE_TRANSIENT, $live, 6 * MINUTE_IN_SECONDS );
}

/**
 * Processa um lote de eventos de telemetria enviados pelo front-end.
 *
 * @param array<int, array<string, mixed>> $events Lista de eventos sanitizáveis.
 * @param string                           $sid    ID efêmero de sessão (opcional).
 * @return int Número de eventos aceitos.
 */
function teoriageek_analytics_ingest_events( array $events, $sid = '' ) {
	if ( empty( $events ) ) {
		return 0;
	}

	$today = wp_date( 'Y-m-d' );
	$hour  = max( 0, min( 23, (int) wp_date( 'G' ) ) );

	$days = get_option( TEORIAGEEK_ANALYTICS_OPTION, array() );
	if ( ! is_array( $days ) ) {
		$days = array();
	}
	if ( ! isset( $days[ $today ] ) || ! is_array( $days[ $today ] ) ) {
		$days[ $today ] = teoriageek_analytics_empty_day();
	}

	$day        = array_replace_recursive( teoriageek_analytics_empty_day(), $days[ $today ] );
	$zones_ok   = teoriageek_analytics_zone_catalog();
	$convs_ok   = teoriageek_analytics_conversion_catalog();
	$types_ok   = array( 'home', 'single', 'reels', 'category', 'universo', 'search', 'page', 'other' );
	$devices_ok = array( 'mobile', 'desktop', 'tablet' );
	$accepted   = 0;
	$last_path  = '';
	$last_dev   = 'desktop';

	foreach ( array_slice( $events, 0, 25 ) as $ev ) {
		if ( ! is_array( $ev ) ) {
			continue;
		}
		$type = sanitize_key( (string) ( $ev['t'] ?? '' ) );
		$path = teoriageek_analytics_norm_path( (string) ( $ev['p'] ?? '/' ) );
		$dev  = sanitize_key( (string) ( $ev['d'] ?? 'desktop' ) );
		if ( ! in_array( $dev, $devices_ok, true ) ) {
			$dev = 'desktop';
		}
		$last_path = $path;
		$last_dev  = $dev;

		if ( 'pv' === $type ) {
			$day['pv']             = (int) $day['pv'] + 1;
			$day['hours'][ $hour ] = (int) ( $day['hours'][ $hour ] ?? 0 ) + 1;
			$day['dev'][ $dev ]    = (int) ( $day['dev'][ $dev ] ?? 0 ) + 1;

			$pt = sanitize_key( (string) ( $ev['pt'] ?? 'other' ) );
			if ( ! in_array( $pt, $types_ok, true ) ) {
				$pt = 'other';
			}
			$day['types'][ $pt ] = (int) ( $day['types'][ $pt ] ?? 0 ) + 1;

			$sn = max( 1, (int) ( $ev['sn'] ?? 1 ) );
			if ( 1 === $sn ) {
				$day['sess']    = (int) $day['sess'] + 1;
				$day['bounces'] = (int) $day['bounces'] + 1;

				$utm_src  = sanitize_text_field( (string) ( $ev['us'] ?? '' ) );
				$utm_camp = sanitize_text_field( (string) ( $ev['uc'] ?? '' ) );
				$ref_info = teoriageek_analytics_classify_referrer( (string) ( $ev['r'] ?? '' ), $utm_src );
				$ch       = $ref_info['channel'];
				$day['refs'][ $ch ] = (int) ( $day['refs'][ $ch ] ?? 0 ) + 1;
				if ( '' !== $ref_info['domain'] ) {
					$dom = substr( $ref_info['domain'], 0, 80 );
					$day['ref_dom'][ $dom ] = (int) ( $day['ref_dom'][ $dom ] ?? 0 ) + 1;
				}
				if ( '' !== $utm_src || '' !== $utm_camp ) {
					$utm_label = mb_substr( trim( $utm_src . ( '' !== $utm_camp ? ' / ' . $utm_camp : '' ) ), 0, 70, 'UTF-8' );
					if ( '' !== $utm_label ) {
						$day['utm'][ $utm_label ] = (int) ( $day['utm'][ $utm_label ] ?? 0 ) + 1;
					}
				}
			} elseif ( 2 === $sn ) {
				$day['bounces'] = max( 0, (int) $day['bounces'] - 1 );
			}

			$title = mb_substr( trim( sanitize_text_field( (string) ( $ev['tl'] ?? '' ) ) ), 0, 96, 'UTF-8' );
			$pid   = max( 0, (int) ( $ev['pid'] ?? 0 ) );
			if ( ! isset( $day['pages'][ $path ] ) || ! is_array( $day['pages'][ $path ] ) ) {
				$day['pages'][ $path ] = array(
					't'   => $title,
					'pv'  => 0,
					'clk' => 0,
					'es'  => 0,
					'en'  => 0,
					'pid' => $pid,
				);
			}
			$day['pages'][ $path ]['pv'] = (int) $day['pages'][ $path ]['pv'] + 1;
			if ( '' !== $title ) {
				$day['pages'][ $path ]['t'] = $title;
			}
			if ( $pid > 0 ) {
				$day['pages'][ $path ]['pid'] = $pid;
			}
			if ( 'single' === $pt ) {
				$day['scroll']['base'] = (int) ( $day['scroll']['base'] ?? 0 ) + 1;
			}
			$accepted++;
		} elseif ( 'clk' === $type ) {
			$zone = sanitize_key( (string) ( $ev['z'] ?? 'outros' ) );
			if ( ! isset( $zones_ok[ $zone ] ) ) {
				$zone = 'outros';
			}
			$day['clk']            = (int) $day['clk'] + 1;
			$day['zones'][ $zone ] = (int) ( $day['zones'][ $zone ] ?? 0 ) + 1;

			if ( isset( $day['pages'][ $path ] ) && is_array( $day['pages'][ $path ] ) ) {
				$day['pages'][ $path ]['clk'] = (int) ( $day['pages'][ $path ]['clk'] ?? 0 ) + 1;
			}

			$label  = mb_substr( trim( sanitize_text_field( (string) ( $ev['l'] ?? '' ) ) ), 0, 88, 'UTF-8' );
			$target = mb_substr( trim( sanitize_text_field( (string) ( $ev['u'] ?? '' ) ) ), 0, 140, 'UTF-8' );
			if ( '' !== $label || '' !== $target ) {
				$ckey = substr( md5( $zone . '|' . mb_strtolower( $label, 'UTF-8' ) . '|' . $target ), 0, 12 );
				if ( ! isset( $day['clicks'][ $ckey ] ) || ! is_array( $day['clicks'][ $ckey ] ) ) {
					$day['clicks'][ $ckey ] = array(
						'l' => '' !== $label ? $label : $target,
						'u' => $target,
						'z' => $zone,
						'c' => 0,
					);
				}
				$day['clicks'][ $ckey ]['c'] = (int) $day['clicks'][ $ckey ]['c'] + 1;
			}

			$conv = sanitize_key( (string) ( $ev['cv'] ?? '' ) );
			if ( '' !== $conv && isset( $convs_ok[ $conv ] ) ) {
				$day['conv'][ $conv ] = (int) ( $day['conv'][ $conv ] ?? 0 ) + 1;
			}
			$accepted++;
		} elseif ( 'eng' === $type ) {
			$sec = max( 0, min( 900, (int) ( $ev['s'] ?? 0 ) ) );
			if ( $sec >= 2 ) {
				$day['eng_s'] = (int) $day['eng_s'] + $sec;
				$day['eng_n'] = (int) $day['eng_n'] + 1;
				if ( isset( $day['pages'][ $path ] ) && is_array( $day['pages'][ $path ] ) ) {
					$day['pages'][ $path ]['es'] = (int) ( $day['pages'][ $path ]['es'] ?? 0 ) + $sec;
					$day['pages'][ $path ]['en'] = (int) ( $day['pages'][ $path ]['en'] ?? 0 ) + 1;
				}
			}
			$max_depth = max( 0, min( 100, (int) ( $ev['sc'] ?? 0 ) ) );
			if ( $max_depth >= 25 ) {
				$day['scroll']['p25'] = (int) ( $day['scroll']['p25'] ?? 0 ) + 1;
			}
			if ( $max_depth >= 50 ) {
				$day['scroll']['p50'] = (int) ( $day['scroll']['p50'] ?? 0 ) + 1;
			}
			if ( $max_depth >= 75 ) {
				$day['scroll']['p75'] = (int) ( $day['scroll']['p75'] ?? 0 ) + 1;
			}
			if ( $max_depth >= 95 ) {
				$day['scroll']['p100'] = (int) ( $day['scroll']['p100'] ?? 0 ) + 1;
			}
			$accepted++;
		} elseif ( 'conv' === $type ) {
			$conv = sanitize_key( (string) ( $ev['cv'] ?? '' ) );
			if ( '' !== $conv && isset( $convs_ok[ $conv ] ) ) {
				$day['conv'][ $conv ] = (int) ( $day['conv'][ $conv ] ?? 0 ) + 1;
				$accepted++;
			}
		} elseif ( 'srch' === $type ) {
			$term = mb_substr( trim( mb_strtolower( sanitize_text_field( (string) ( $ev['q'] ?? '' ) ), 'UTF-8' ) ), 0, 64, 'UTF-8' );
			if ( mb_strlen( $term, 'UTF-8' ) >= 2 ) {
				$res_cnt = (int) ( $ev['rc'] ?? -1 );
				if ( ! isset( $day['searches'][ $term ] ) || ! is_array( $day['searches'][ $term ] ) ) {
					$day['searches'][ $term ] = array( 'c' => 0, 'z' => 0 );
				}
				$day['searches'][ $term ]['c'] = (int) $day['searches'][ $term ]['c'] + 1;
				if ( 0 === $res_cnt ) {
					$day['searches'][ $term ]['z'] = (int) $day['searches'][ $term ]['z'] + 1;
				}
				$accepted++;
			}
		}
	}

	if ( 0 === $accepted ) {
		return 0;
	}

	// Mantém o armazenamento compacto na Locaweb (limites rígidos por dia + retenção de 30 dias).
	$day['ref_dom']  = teoriageek_analytics_cap_int_map( $day['ref_dom'], 25 );
	$day['utm']      = teoriageek_analytics_cap_int_map( $day['utm'], 20 );
	$day['clicks']   = teoriageek_analytics_cap_struct_map( $day['clicks'], 'c', 45 );
	$day['pages']    = teoriageek_analytics_cap_struct_map( $day['pages'], 'pv', 50 );
	$day['searches'] = teoriageek_analytics_cap_struct_map( $day['searches'], 'c', 30 );

	$days[ $today ] = $day;

	$cutoff = wp_date( 'Y-m-d', time() - ( TEORIAGEEK_ANALYTICS_RETENTION_DAYS * DAY_IN_SECONDS ) );
	foreach ( array_keys( $days ) as $dkey ) {
		if ( (string) $dkey < $cutoff ) {
			unset( $days[ $dkey ] );
		}
	}
	ksort( $days );

	update_option( TEORIAGEEK_ANALYTICS_OPTION, $days, false );

	if ( '' !== $sid && '' !== $last_path ) {
		teoriageek_analytics_touch_live( $sid, $last_path, $last_dev );
	}

	return $accepted;
}

/**
 * Consolida a janela de leitores ativos nos últimos 5 minutos.
 *
 * @return array{onlineNow:int,byDevice:array{mobile:int,desktop:int,tablet:int},topLivePages:array<int,array{path:string,count:int}>}
 */
function teoriageek_analytics_get_realtime() {
	$now  = time();
	$live = get_transient( TEORIAGEEK_ANALYTICS_LIVE_TRANSIENT );
	$devs = array(
		'mobile'  => 0,
		'desktop' => 0,
		'tablet'  => 0,
	);
	$pages = array();
	$count = 0;

	if ( is_array( $live ) ) {
		foreach ( $live as $entry ) {
			if ( ! is_array( $entry ) || ( $now - (int) ( $entry['t'] ?? 0 ) ) > 300 ) {
				continue;
			}
			$count++;
			$d = (string) ( $entry['d'] ?? 'desktop' );
			if ( isset( $devs[ $d ] ) ) {
				$devs[ $d ]++;
			}
			$p = (string) ( $entry['p'] ?? '/' );
			$pages[ $p ] = ( $pages[ $p ] ?? 0 ) + 1;
		}
	}

	arsort( $pages, SORT_NUMERIC );
	$top_live = array();
	foreach ( array_slice( $pages, 0, 6, true ) as $p => $c ) {
		$top_live[] = array(
			'path'  => (string) $p,
			'count' => (int) $c,
		);
	}

	return array(
		'onlineNow'    => $count,
		'byDevice'     => $devs,
		'topLivePages' => $top_live,
	);
}

/**
 * Monta o relatório completo estilo Google Analytics para a Central Teoria Geek.
 *
 * @param string $range Período solicitado (`today`, `7d`, `14d`, `30d`).
 * @return array<string, mixed>
 */
function teoriageek_analytics_get_report( $range = '7d' ) {
	$range_map = array(
		'today' => array( 'days' => 1, 'label' => __( 'Hoje', 'teoriageek' ) ),
		'7d'    => array( 'days' => 7, 'label' => __( 'Últimos 7 dias', 'teoriageek' ) ),
		'14d'   => array( 'days' => 14, 'label' => __( 'Últimos 14 dias', 'teoriageek' ) ),
		'30d'   => array( 'days' => 30, 'label' => __( 'Últimos 30 dias', 'teoriageek' ) ),
	);
	if ( ! isset( $range_map[ $range ] ) ) {
		$range = '7d';
	}
	$span = $range_map[ $range ]['days'];

	$days = get_option( TEORIAGEEK_ANALYTICS_OPTION, array() );
	if ( ! is_array( $days ) ) {
		$days = array();
	}

	$tz        = wp_timezone();
	$cur_keys  = array();
	$prev_keys = array();
	$daily     = array();

	for ( $i = $span - 1; $i >= 0; $i-- ) {
		$dt         = new DateTimeImmutable( '-' . $i . ' days', $tz );
		$k          = $dt->format( 'Y-m-d' );
		$cur_keys[] = $k;
		$bucket     = isset( $days[ $k ] ) && is_array( $days[ $k ] ) ? $days[ $k ] : null;
		$daily[]    = array(
			'date'     => $k,
			'label'    => $dt->format( 'd/m' ),
			'pv'       => $bucket ? (int) ( $bucket['pv'] ?? 0 ) : 0,
			'sessions' => $bucket ? (int) ( $bucket['sess'] ?? 0 ) : 0,
			'clicks'   => $bucket ? (int) ( $bucket['clk'] ?? 0 ) : 0,
		);
	}
	if ( $span <= 14 ) {
		for ( $i = ( $span * 2 ) - 1; $i >= $span; $i-- ) {
			$dt          = new DateTimeImmutable( '-' . $i . ' days', $tz );
			$prev_keys[] = $dt->format( 'Y-m-d' );
		}
	}

	$tot_pv      = 0;
	$tot_sess    = 0;
	$tot_bounces = 0;
	$tot_clk     = 0;
	$tot_eng_s   = 0;
	$tot_eng_n   = 0;
	$days_active = 0;

	$hours      = array_fill( 0, 24, 0 );
	$dev_acc    = array( 'mobile' => 0, 'desktop' => 0, 'tablet' => 0 );
	$types_acc  = array();
	$refs_acc   = array();
	$refdom_acc = array();
	$zones_acc  = array();
	$clicks_acc = array();
	$pages_acc  = array();
	$scroll_acc = array( 'base' => 0, 'p25' => 0, 'p50' => 0, 'p75' => 0, 'p100' => 0 );
	$conv_acc   = array();
	$search_acc = array();
	$utm_acc    = array();

	foreach ( $cur_keys as $k ) {
		if ( empty( $days[ $k ] ) || ! is_array( $days[ $k ] ) ) {
			continue;
		}
		$d = $days[ $k ];
		if ( (int) ( $d['pv'] ?? 0 ) > 0 || (int) ( $d['clk'] ?? 0 ) > 0 ) {
			$days_active++;
		}
		$tot_pv      += (int) ( $d['pv'] ?? 0 );
		$tot_sess    += (int) ( $d['sess'] ?? 0 );
		$tot_bounces += (int) ( $d['bounces'] ?? 0 );
		$tot_clk     += (int) ( $d['clk'] ?? 0 );
		$tot_eng_s   += (int) ( $d['eng_s'] ?? 0 );
		$tot_eng_n   += (int) ( $d['eng_n'] ?? 0 );

		if ( isset( $d['hours'] ) && is_array( $d['hours'] ) ) {
			for ( $h = 0; $h < 24; $h++ ) {
				$hours[ $h ] += (int) ( $d['hours'][ $h ] ?? 0 );
			}
		}
		foreach ( array( 'mobile', 'desktop', 'tablet' ) as $dv ) {
			$dev_acc[ $dv ] += (int) ( $d['dev'][ $dv ] ?? 0 );
		}
		foreach ( (array) ( $d['types'] ?? array() ) as $tk => $tv ) {
			$types_acc[ $tk ] = ( $types_acc[ $tk ] ?? 0 ) + (int) $tv;
		}
		foreach ( (array) ( $d['refs'] ?? array() ) as $rk => $rv ) {
			$refs_acc[ $rk ] = ( $refs_acc[ $rk ] ?? 0 ) + (int) $rv;
		}
		foreach ( (array) ( $d['ref_dom'] ?? array() ) as $dk => $dv ) {
			$refdom_acc[ $dk ] = ( $refdom_acc[ $dk ] ?? 0 ) + (int) $dv;
		}
		foreach ( (array) ( $d['zones'] ?? array() ) as $zk => $zv ) {
			$zones_acc[ $zk ] = ( $zones_acc[ $zk ] ?? 0 ) + (int) $zv;
		}
		foreach ( (array) ( $d['clicks'] ?? array() ) as $ck => $cv ) {
			if ( ! is_array( $cv ) ) {
				continue;
			}
			if ( ! isset( $clicks_acc[ $ck ] ) ) {
				$clicks_acc[ $ck ] = array(
					'l' => (string) ( $cv['l'] ?? '' ),
					'u' => (string) ( $cv['u'] ?? '' ),
					'z' => (string) ( $cv['z'] ?? 'outros' ),
					'c' => 0,
				);
			}
			$clicks_acc[ $ck ]['c'] += (int) ( $cv['c'] ?? 0 );
		}
		foreach ( (array) ( $d['pages'] ?? array() ) as $pk => $pv ) {
			if ( ! is_array( $pv ) ) {
				continue;
			}
			if ( ! isset( $pages_acc[ $pk ] ) ) {
				$pages_acc[ $pk ] = array(
					't'   => (string) ( $pv['t'] ?? '' ),
					'pv'  => 0,
					'clk' => 0,
					'es'  => 0,
					'en'  => 0,
					'pid' => (int) ( $pv['pid'] ?? 0 ),
				);
			}
			$pages_acc[ $pk ]['pv']  += (int) ( $pv['pv'] ?? 0 );
			$pages_acc[ $pk ]['clk'] += (int) ( $pv['clk'] ?? 0 );
			$pages_acc[ $pk ]['es']  += (int) ( $pv['es'] ?? 0 );
			$pages_acc[ $pk ]['en']  += (int) ( $pv['en'] ?? 0 );
			if ( ! empty( $pv['t'] ) ) {
				$pages_acc[ $pk ]['t'] = (string) $pv['t'];
			}
			if ( ! empty( $pv['pid'] ) ) {
				$pages_acc[ $pk ]['pid'] = (int) $pv['pid'];
			}
		}
		foreach ( array( 'base', 'p25', 'p50', 'p75', 'p100' ) as $sk ) {
			$scroll_acc[ $sk ] += (int) ( $d['scroll'][ $sk ] ?? 0 );
		}
		foreach ( (array) ( $d['conv'] ?? array() ) as $cvk => $cvv ) {
			$conv_acc[ $cvk ] = ( $conv_acc[ $cvk ] ?? 0 ) + (int) $cvv;
		}
		foreach ( (array) ( $d['searches'] ?? array() ) as $sq => $sv ) {
			if ( ! is_array( $sv ) ) {
				continue;
			}
			if ( ! isset( $search_acc[ $sq ] ) ) {
				$search_acc[ $sq ] = array( 'c' => 0, 'z' => 0 );
			}
			$search_acc[ $sq ]['c'] += (int) ( $sv['c'] ?? 0 );
			$search_acc[ $sq ]['z'] += (int) ( $sv['z'] ?? 0 );
		}
		foreach ( (array) ( $d['utm'] ?? array() ) as $uk => $uv ) {
			$utm_acc[ $uk ] = ( $utm_acc[ $uk ] ?? 0 ) + (int) $uv;
		}
	}

	// Comparação com período anterior.
	$prev_pv   = 0;
	$prev_sess = 0;
	$prev_clk  = 0;
	foreach ( $prev_keys as $pk ) {
		if ( ! empty( $days[ $pk ] ) && is_array( $days[ $pk ] ) ) {
			$prev_pv   += (int) ( $days[ $pk ]['pv'] ?? 0 );
			$prev_sess += (int) ( $days[ $pk ]['sess'] ?? 0 );
			$prev_clk  += (int) ( $days[ $pk ]['clk'] ?? 0 );
		}
	}
	$calc_delta = static function ( $curr, $prev ) {
		if ( $prev <= 0 ) {
			return null;
		}
		return (int) round( ( ( $curr - $prev ) / $prev ) * 100 );
	};

	// Click Zones formatadas e ordenadas.
	$zone_cat    = teoriageek_analytics_zone_catalog();
	$click_zones = array();
	arsort( $zones_acc, SORT_NUMERIC );
	foreach ( $zones_acc as $zid => $cnt ) {
		if ( $cnt <= 0 ) {
			continue;
		}
		$meta          = $zone_cat[ $zid ] ?? array( 'label' => $zid, 'desc' => '' );
		$click_zones[] = array(
			'id'     => (string) $zid,
			'label'  => (string) $meta['label'],
			'desc'   => (string) $meta['desc'],
			'clicks' => (int) $cnt,
			'pct'    => $tot_clk > 0 ? round( ( $cnt / $tot_clk ) * 100, 1 ) : 0.0,
		);
	}

	// Top 15 links / elementos mais clicados.
	uasort(
		$clicks_acc,
		static function ( $a, $b ) {
			return (int) $b['c'] <=> (int) $a['c'];
		}
	);
	$top_clicks = array();
	foreach ( array_slice( $clicks_acc, 0, 15 ) as $item ) {
		$zmeta        = $zone_cat[ $item['z'] ] ?? array( 'label' => $item['z'] );
		$top_clicks[] = array(
			'label'     => (string) $item['l'],
			'target'    => (string) $item['u'],
			'zone'      => (string) $item['z'],
			'zoneLabel' => (string) $zmeta['label'],
			'clicks'    => (int) $item['c'],
			'pct'       => $tot_clk > 0 ? round( ( $item['c'] / $tot_clk ) * 100, 1 ) : 0.0,
		);
	}

	// Referrers.
	$ref_cat   = teoriageek_analytics_referrer_catalog();
	$ref_total = array_sum( $refs_acc );
	arsort( $refs_acc, SORT_NUMERIC );
	$referrers = array();
	foreach ( $refs_acc as $rid => $vcnt ) {
		if ( $vcnt <= 0 ) {
			continue;
		}
		$rmeta       = $ref_cat[ $rid ] ?? array( 'label' => $rid, 'color' => '#94A3B8' );
		$referrers[] = array(
			'id'     => (string) $rid,
			'label'  => (string) $rmeta['label'],
			'color'  => (string) $rmeta['color'],
			'visits' => (int) $vcnt,
			'pct'    => $ref_total > 0 ? round( ( $vcnt / $ref_total ) * 100, 1 ) : 0.0,
		);
	}

	// Top domínios externos.
	arsort( $refdom_acc, SORT_NUMERIC );
	$dom_total   = array_sum( $refdom_acc );
	$top_domains = array();
	foreach ( array_slice( $refdom_acc, 0, 10, true ) as $dom => $dcnt ) {
		$top_domains[] = array(
			'domain' => (string) $dom,
			'visits' => (int) $dcnt,
			'pct'    => $dom_total > 0 ? round( ( $dcnt / $dom_total ) * 100, 1 ) : 0.0,
		);
	}

	// Dispositivos.
	$dev_total = array_sum( $dev_acc );
	$devices   = array(
		array(
			'id'    => 'mobile',
			'label' => __( 'Celular (Mobile)', 'teoriageek' ),
			'color' => '#0073E6',
			'count' => (int) $dev_acc['mobile'],
			'pct'   => $dev_total > 0 ? round( ( $dev_acc['mobile'] / $dev_total ) * 100, 1 ) : 0.0,
		),
		array(
			'id'    => 'desktop',
			'label' => __( 'Computador (Desktop)', 'teoriageek' ),
			'color' => '#FACC15',
			'count' => (int) $dev_acc['desktop'],
			'pct'   => $dev_total > 0 ? round( ( $dev_acc['desktop'] / $dev_total ) * 100, 1 ) : 0.0,
		),
		array(
			'id'    => 'tablet',
			'label' => __( 'Tablet', 'teoriageek' ),
			'color' => '#34D399',
			'count' => (int) $dev_acc['tablet'],
			'pct'   => $dev_total > 0 ? round( ( $dev_acc['tablet'] / $dev_total ) * 100, 1 ) : 0.0,
		),
	);

	// Tipos de página.
	$type_labels = array(
		'single'   => __( 'Matérias & Críticas', 'teoriageek' ),
		'home'     => __( 'Capa (Home)', 'teoriageek' ),
		'reels'    => __( 'Reels (/reels/)', 'teoriageek' ),
		'category' => __( 'Editorias', 'teoriageek' ),
		'universo' => __( 'Hubs de Universo', 'teoriageek' ),
		'search'   => __( 'Resultados de Busca', 'teoriageek' ),
		'page'     => __( 'Páginas Institucionais', 'teoriageek' ),
		'other'    => __( 'Outras Páginas', 'teoriageek' ),
	);
	arsort( $types_acc, SORT_NUMERIC );
	$page_types = array();
	foreach ( $types_acc as $tk => $tcnt ) {
		if ( $tcnt <= 0 ) {
			continue;
		}
		$page_types[] = array(
			'id'    => (string) $tk,
			'label' => $type_labels[ $tk ] ?? (string) $tk,
			'count' => (int) $tcnt,
			'pct'   => $tot_pv > 0 ? round( ( $tcnt / $tot_pv ) * 100, 1 ) : 0.0,
		);
	}

	// Funil de Scroll Depth em matérias.
	$scroll_base = max( (int) $scroll_acc['base'], (int) $scroll_acc['p25'] );
	$scroll_steps = array();
	foreach ( array( 'p25' => '25%', 'p50' => '50%', 'p75' => '75%', 'p100' => '100% (Fim)' ) as $sk => $slbl ) {
		$scnt           = (int) $scroll_acc[ $sk ];
		$scroll_steps[] = array(
			'key'   => $sk,
			'label' => $slbl,
			'count' => $scnt,
			'pct'   => $scroll_base > 0 ? min( 100.0, round( ( $scnt / $scroll_base ) * 100, 1 ) ) : 0.0,
		);
	}
	$completion_rate = $scroll_base > 0 ? min( 100.0, round( ( $scroll_acc['p75'] / $scroll_base ) * 100, 1 ) ) : 0.0;

	// Horários 00h–23h.
	$hourly   = array();
	$peak_hr  = 0;
	$peak_val = -1;
	for ( $h = 0; $h < 24; $h++ ) {
		$v = (int) $hours[ $h ];
		if ( $v > $peak_val ) {
			$peak_val = $v;
			$peak_hr  = $h;
		}
		$hourly[] = array(
			'hour'  => $h,
			'label' => sprintf( '%02dh', $h ),
			'pv'    => $v,
		);
	}

	// Top 12 páginas mais acessadas.
	uasort(
		$pages_acc,
		static function ( $a, $b ) {
			return (int) $b['pv'] <=> (int) $a['pv'];
		}
	);
	$top_pages = array();
	foreach ( array_slice( $pages_acc, 0, 12, true ) as $path => $pinfo ) {
		$pid       = (int) ( $pinfo['pid'] ?? 0 );
		$avg_s     = (int) $pinfo['en'] > 0 ? (int) round( $pinfo['es'] / $pinfo['en'] ) : 0;
		$view_url  = home_url( $path );
		$edit_url  = ( $pid > 0 && current_user_can( 'edit_post', $pid ) ) ? ( get_edit_post_link( $pid, 'raw' ) ?: '' ) : '';
		$top_pages[] = array(
			'path'    => (string) $path,
			'title'   => '' !== $pinfo['t'] ? (string) $pinfo['t'] : (string) $path,
			'pv'      => (int) $pinfo['pv'],
			'clicks'  => (int) $pinfo['clk'],
			'avgSec'  => $avg_s,
			'viewUrl' => esc_url_raw( $view_url ),
			'editUrl' => esc_url_raw( $edit_url ),
		);
	}

	// Conversões & CTAs.
	$conv_cat    = teoriageek_analytics_conversion_catalog();
	$conversions = array();
	$conv_total  = 0;
	foreach ( $conv_cat as $cid => $cmeta ) {
		$ccnt        = (int) ( $conv_acc[ $cid ] ?? 0 );
		$conv_total += $ccnt;
		$conversions[] = array(
			'id'    => $cid,
			'label' => $cmeta['label'],
			'color' => $cmeta['color'],
			'count' => $ccnt,
		);
	}
	usort(
		$conversions,
		static function ( $a, $b ) {
			return $b['count'] <=> $a['count'];
		}
	);

	// Top buscas.
	uasort(
		$search_acc,
		static function ( $a, $b ) {
			return (int) $b['c'] <=> (int) $a['c'];
		}
	);
	$top_searches = array();
	foreach ( array_slice( $search_acc, 0, 12, true ) as $term => $sinfo ) {
		$top_searches[] = array(
			'term'        => (string) $term,
			'count'       => (int) $sinfo['c'],
			'zeroResults' => (int) $sinfo['z'],
		);
	}

	// Top UTMs.
	arsort( $utm_acc, SORT_NUMERIC );
	$utm_list = array();
	foreach ( array_slice( $utm_acc, 0, 10, true ) as $uname => $ucnt ) {
		$utm_list[] = array(
			'name'   => (string) $uname,
			'visits' => (int) $ucnt,
		);
	}

	$realtime     = teoriageek_analytics_get_realtime();
	$bounce_rate  = $tot_sess > 0 ? round( ( min( $tot_bounces, $tot_sess ) / $tot_sess ) * 100, 1 ) : 0.0;
	$pages_per_s  = $tot_sess > 0 ? round( $tot_pv / $tot_sess, 2 ) : 0.0;
	$avg_eng_sec  = $tot_eng_n > 0 ? (int) round( $tot_eng_s / $tot_eng_n ) : 0;
	$clk_per_sess = $tot_sess > 0 ? round( $tot_clk / $tot_sess, 2 ) : 0.0;

	return array(
		'range'              => $range,
		'rangeLabel'         => $range_map[ $range ]['label'],
		'daysWithData'       => $days_active,
		'realtime'           => $realtime,
		'summary'            => array(
			'onlineNow'       => (int) $realtime['onlineNow'],
			'pageviews'       => $tot_pv,
			'sessions'        => $tot_sess,
			'clicks'          => $tot_clk,
			'conversions'     => $conv_total,
			'avgEngagedSec'   => $avg_eng_sec,
			'bounceRate'      => $bounce_rate,
			'pagesPerSession' => $pages_per_s,
			'clicksPerSess'   => $clk_per_sess,
			'completionRate'  => $completion_rate,
			'pvDeltaPct'      => $calc_delta( $tot_pv, $prev_pv ),
			'sessDeltaPct'    => $calc_delta( $tot_sess, $prev_sess ),
			'clkDeltaPct'     => $calc_delta( $tot_clk, $prev_clk ),
			'topZoneLabel'    => ! empty( $click_zones ) ? $click_zones[0]['label'] : '',
			'topZonePct'      => ! empty( $click_zones ) ? $click_zones[0]['pct'] : 0.0,
			'topRefLabel'     => ! empty( $referrers ) ? $referrers[0]['label'] : '',
			'topRefPct'       => ! empty( $referrers ) ? $referrers[0]['pct'] : 0.0,
		),
		'dailySeries'        => $daily,
		'clickZones'         => $click_zones,
		'topClicks'          => $top_clicks,
		'referrers'          => $referrers,
		'topReferrerDomains' => $top_domains,
		'devices'            => $devices,
		'pageTypes'          => $page_types,
		'scrollFunnel'       => array(
			'base'  => $scroll_base,
			'steps' => $scroll_steps,
		),
		'hourly24'           => $hourly,
		'peakHour'           => $peak_val > 0 ? sprintf( '%02dh', $peak_hr ) : '',
		'topPages'           => $top_pages,
		'conversions'        => $conversions,
		'topSearches'        => $top_searches,
		'utmCampaigns'       => $utm_list,
	);
}

/**
 * Zera os dados armazenados de Analytics First-Party (uso administrativo).
 */
function teoriageek_analytics_reset_data() {
	delete_option( TEORIAGEEK_ANALYTICS_OPTION );
	delete_transient( TEORIAGEEK_ANALYTICS_LIVE_TRANSIENT );
}

/**
 * Registra o endpoint REST público `POST /wp-json/teoriageek/v1/telemetry`.
 * Não exige `X-WP-Nonce` para operar com 100% de confiabilidade sob WP Super Cache.
 */
function teoriageek_register_analytics_rest_route() {
	register_rest_route(
		'teoriageek/v1',
		'/telemetry',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'permission_callback' => '__return_true',
			'callback'            => static function ( WP_REST_Request $request ) {
				$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
				if ( teoriageek_analytics_is_bot_ua( $ua ) ) {
					return rest_ensure_response( array( 'ok' => true, 'accepted' => 0 ) );
				}

				if ( function_exists( 'teoriageek_rest_rate_limit_ok' ) && ! teoriageek_rest_rate_limit_ok( 'telemetry', 120 ) ) {
					return new WP_Error( 'rate_limited', __( 'Limite temporário de telemetria atingido.', 'teoriageek' ), array( 'status' => 429 ) );
				}

				$raw = $request->get_body();
				if ( '' === $raw || strlen( $raw ) > 32768 ) {
					return rest_ensure_response( array( 'ok' => true, 'accepted' => 0 ) );
				}

				$decoded = json_decode( $raw, true );
				if ( ! is_array( $decoded ) || empty( $decoded['events'] ) || ! is_array( $decoded['events'] ) ) {
					return rest_ensure_response( array( 'ok' => true, 'accepted' => 0 ) );
				}

				$sid      = preg_replace( '/[^a-zA-Z0-9_-]/', '', (string) ( $decoded['sid'] ?? '' ) );
				$sid      = substr( $sid, 0, 32 );
				$accepted = teoriageek_analytics_ingest_events( $decoded['events'], $sid );

				$res = rest_ensure_response(
					array(
						'ok'       => true,
						'accepted' => $accepted,
					)
				);
				if ( $res instanceof WP_REST_Response ) {
					$res->header( 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0' );
				}
				return $res;
			},
		)
	);
}
add_action( 'rest_api_init', 'teoriageek_register_analytics_rest_route' );
