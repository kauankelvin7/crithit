<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html lang="pt-BR">
			<head>
				<meta charset="UTF-8"/>
				<meta name="viewport" content="width=device-width, initial-scale=1"/>
				<title><xsl:value-of select="/rss/channel/title"/> — Feed RSS</title>
				<style>
					:root{color-scheme:dark light}
					body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0f19;color:#f8fafc;line-height:1.55}
					.wrap{max-width:780px;margin:0 auto;padding:2rem 1.25rem 3rem}
					.hero{background:#151d2e;border:1px solid rgba(255,255,255,.12);border-top:4px solid #facc15;border-radius:2px;padding:1.5rem;margin-bottom:1.5rem}
					.badge{display:inline-block;background:#facc15;color:#0b0f19;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding:.25rem .6rem;border-radius:2px;margin-bottom:.75rem}
					h1{margin:0 0 .5rem;font-size:1.75rem;line-height:1.15}
					.sub{margin:0 0 1rem;color:#b8c2d4;font-size:.95rem}
					.btn{display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;font-weight:700;font-size:.85rem;padding:.55rem 1.1rem;border-radius:2px}
					.item{background:#131a2a;border:1px solid rgba(255,255,255,.1);border-radius:2px;padding:1.1rem 1.25rem;margin-bottom:.85rem}
					.item h2{margin:0 0 .35rem;font-size:1.1rem;line-height:1.3}
					.item h2 a{color:#f8fafc;text-decoration:none}
					.item h2 a:hover{color:#facc15;text-decoration:underline}
					.meta{font-size:.78rem;color:#94a3b8;margin-bottom:.45rem}
					.desc{margin:0;font-size:.9rem;color:#cbd5e1}
				</style>
			</head>
			<body>
				<div class="wrap">
					<header class="hero">
						<span class="badge">Feed RSS Oficial</span>
						<h1><xsl:value-of select="/rss/channel/title"/></h1>
						<p class="sub">Este é o feed de notícias para leitores de RSS (como Feedly e Inoreader). Copie o endereço desta página no seu leitor favorito ou volte para o portal completo.</p>
						<a class="btn"><xsl:attribute name="href"><xsl:value-of select="/rss/channel/link"/></xsl:attribute>Ir para o Teoria Geek →</a>
					</header>
					<main>
						<xsl:for-each select="/rss/channel/item">
							<article class="item">
								<div class="meta"><xsl:value-of select="pubDate"/></div>
								<h2><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a></h2>
								<p class="desc"><xsl:value-of select="description" disable-output-escaping="no"/></p>
							</article>
						</xsl:for-each>
					</main>
				</div>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
