export type ArticleStatus =
  | 'PENDING_REVIEW'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'DISCARDED';

export type AiStatus = 'SUCCESS' | 'FALLBACK_RAW' | 'MANUAL';

export type Category = 'GAMES' | 'COMICS' | 'CINEMA' | 'ANIMES' | 'TECH';

export type EditorialFormat = 'NEWS' | 'COLUMN' | 'REVIEW';

export type ContentType = 'AUTORAL' | 'CURADORIA';

export interface AttributionInfo {
  authorName: string;
  contentType: ContentType;
  sourceName: string;
  sourceUrl: string;
}

export interface MatchedSourceDto {
  id: string;
  sourceName: string;
  sourceUrl: string;
  originalTitle: string;
  originalExcerpt: string | null;
  similarityScore: number;
  isPrimary: boolean;
  fetchedAt: string;
}

export interface PublicArticleSummary {
  id: string;
  slug: string;
  category: Category;
  editorialFormat: EditorialFormat;
  headline: string;
  subheadlineBullets: string[];
  lead: string;
  reelsSummary: string;
  tags: string[];
  coverImageUrl: string | null;
  coverArtKey: string;
  readingTimeMinutes: number;
  reviewScore: number | null;
  isMainHeadline: boolean;
  isUrgent: boolean;
  viewsCount: number;
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  publishedAt: string;
  attribution: AttributionInfo;
  matchedSources?: MatchedSourceDto[];
}

export interface PublicArticleDetail extends PublicArticleSummary {
  bodyParagraphs: string[];
  matchedSources: MatchedSourceDto[];
  relatedArticles: PublicArticleSummary[];
  viewerState: {
    liked: boolean;
    saved: boolean;
  };
}

export interface BreakingTickerItem {
  slug: string;
  headline: string;
  category: Category;
  publishedAt: string;
}

export interface HomeResponse {
  breakingTicker: BreakingTickerItem[];
  mainHeadline: PublicArticleSummary | null;
  secondaryHeadlines: PublicArticleSummary[];
  urgentNews: PublicArticleSummary[];
  giroGeek: PublicArticleSummary[];
  columnsAndReviews: PublicArticleSummary[];
  featuredReels: PublicArticleSummary[];
  categoryBlocks: Partial<Record<Category, PublicArticleSummary[]>>;
  mostRead: PublicArticleSummary[];
  generatedAt: string;
}

export interface PublicArticlePage {
  content: PublicArticleSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ReelsFeedResponse {
  items: PublicArticleSummary[];
  page: number;
  size: number;
  totalElements: number;
  hasNext: boolean;
  focusSlugFound: boolean;
}

export interface CommentDto {
  id: string;
  articleId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
}

export interface CommentPage {
  content: CommentDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUserDto {
  id: string;
  email: string;
  displayName: string;
  role: 'ROLE_ADMIN' | 'ROLE_EDITOR';
}

export interface AdminArticleSummary extends PublicArticleSummary {
  status: ArticleStatus;
  aiStatus: AiStatus;
  scheduledAt: string | null;
  unpublishedAt: string | null;
  discardedAt: string | null;
  createdAt: string;
  updatedAt: string;
  matchedSourcesCount: number;
}

export interface AdminArticleDetail extends AdminArticleSummary {
  bodyParagraphs: string[];
  rawTitle: string | null;
  rawExcerpt: string | null;
  editorialNotes: string[];
  matchedSources: MatchedSourceDto[];
}

export interface AdminArticlePage {
  content: AdminArticleSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminArticleUpsertRequest {
  slug?: string;
  headline: string;
  subheadlineBullets: string[];
  lead: string;
  bodyParagraphs: string[];
  reelsSummary: string;
  category: Category;
  editorialFormat: EditorialFormat;
  tags: string[];
  coverImageUrl: string | null;
  readingTimeMinutes: number;
  reviewScore: number | null;
  isUrgent: boolean;
  authorName: string;
  contentType: ContentType;
  sourceName: string;
  sourceUrl: string;
}

export interface RssSourceDto {
  id: string;
  name: string;
  feedUrl: string;
  siteUrl: string;
  language: 'pt-BR' | 'en' | 'es' | 'ja';
  defaultCategory: Category;
  active: boolean;
  consecutiveFailures: number;
  circuitOpenUntil: string | null;
  lastFetchedAt: string | null;
  lastErrorMessage: string | null;
}

export interface CreateRssSourceRequest {
  name: string;
  feedUrl: string;
  siteUrl: string;
  language: 'pt-BR' | 'en' | 'es' | 'ja';
  defaultCategory: Category;
  active?: boolean;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message: string;
  path?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}
