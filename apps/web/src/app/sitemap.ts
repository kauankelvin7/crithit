import type { MetadataRoute } from 'next';
import { fetchHomeData, getSiteUrl } from '@/lib/api-client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/reels`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  try {
    const home = await fetchHomeData();
    const seen = new Set<string>();
    const articles = [
      ...(home.mainHeadline ? [home.mainHeadline] : []),
      ...home.secondaryHeadlines,
      ...home.giroGeek,
      ...home.columnsAndReviews,
      ...home.featuredReels,
      ...home.mostRead,
    ];

    const articleEntries: MetadataRoute.Sitemap = [];
    for (const article of articles) {
      if (seen.has(article.slug)) continue;
      seen.add(article.slug);
      articleEntries.push({
        url: `${siteUrl}/noticia/${article.slug}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    return [...staticEntries, ...articleEntries];
  } catch {
    return staticEntries;
  }
}
