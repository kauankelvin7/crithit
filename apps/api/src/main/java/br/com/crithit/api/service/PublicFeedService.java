package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.Article;
import br.com.crithit.api.domain.entity.ArticleSource;
import br.com.crithit.api.domain.enums.ArticleStatus;
import br.com.crithit.api.domain.enums.Category;
import br.com.crithit.api.domain.enums.EditorialFormat;
import br.com.crithit.api.domain.enums.InteractionType;
import br.com.crithit.api.repository.ArticleInteractionRepository;
import br.com.crithit.api.repository.ArticleRepository;
import br.com.crithit.api.repository.ArticleSourceRepository;
import br.com.crithit.api.web.dto.HomeResponse;
import br.com.crithit.api.web.dto.PublicArticleDetail;
import br.com.crithit.api.web.dto.PublicArticlePage;
import br.com.crithit.api.web.dto.PublicArticleSummary;
import br.com.crithit.api.web.dto.ReelsFeedResponse;
import br.com.crithit.api.web.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PublicFeedService {

    private final ArticleRepository articleRepository;
    private final ArticleSourceRepository articleSourceRepository;
    private final ArticleInteractionRepository interactionRepository;
    private final ArticleMapper mapper;
    private final ArticleCacheService cacheService;

    public PublicFeedService(
            ArticleRepository articleRepository,
            ArticleSourceRepository articleSourceRepository,
            ArticleInteractionRepository interactionRepository,
            ArticleMapper mapper,
            ArticleCacheService cacheService
    ) {
        this.articleRepository = articleRepository;
        this.articleSourceRepository = articleSourceRepository;
        this.interactionRepository = interactionRepository;
        this.mapper = mapper;
        this.cacheService = cacheService;
    }

    public HomeResponse getHome() {
        Optional<HomeResponse> cached = cacheService.getCachedHome();
        if (cached.isPresent()) {
            return cached.get();
        }

        Optional<Article> mainOpt = articleRepository
                .findTopByStatusAndIsMainHeadlineTrueOrderByPublishedAtDesc(ArticleStatus.PUBLISHED)
                .or(() -> articleRepository.findTopByStatusOrderByPublishedAtDescCreatedAtDesc(ArticleStatus.PUBLISHED));

        PublicArticleSummary mainHeadline = mainOpt.map(mapper::toPublicSummary).orElse(null);

        List<Article> recentPublished = articleRepository.findByStatusOrderByPublishedAtDescCreatedAtDesc(
                ArticleStatus.PUBLISHED, PageRequest.of(0, 20));

        Set<UUID> usedHeroIds = new HashSet<>();
        mainOpt.ifPresent(a -> usedHeroIds.add(a.getId()));

        List<PublicArticleSummary> secondaryHeadlines = new ArrayList<>();
        for (Article candidate : recentPublished) {
            if (secondaryHeadlines.size() >= 3) break;
            if (!usedHeroIds.contains(candidate.getId())) {
                secondaryHeadlines.add(mapper.toPublicSummary(candidate));
                usedHeroIds.add(candidate.getId());
            }
        }

        List<Article> urgentList = articleRepository.findByStatusAndIsUrgentTrueOrderByPublishedAtDesc(
                ArticleStatus.PUBLISHED, PageRequest.of(0, 2));
        List<PublicArticleSummary> urgentNews = urgentList.stream().map(mapper::toPublicSummary).toList();

        List<HomeResponse.BreakingTickerItem> breakingTicker = recentPublished.stream()
                .limit(10)
                .map(a -> new HomeResponse.BreakingTickerItem(
                        a.getSlug(), a.getHeadline(), a.getCategory(), a.getPublishedAt()))
                .toList();

        List<PublicArticleSummary> giroGeek = new ArrayList<>();
        for (Article candidate : recentPublished) {
            if (giroGeek.size() >= 8) break;
            if (!usedHeroIds.contains(candidate.getId())) {
                giroGeek.add(mapper.toPublicSummary(candidate));
            }
        }
        if (giroGeek.isEmpty()) {
            giroGeek = recentPublished.stream().limit(8).map(mapper::toPublicSummary).toList();
        }

        List<PublicArticleSummary> columnsAndReviews = articleRepository
                .findByStatusAndEditorialFormatInOrderByPublishedAtDesc(
                        ArticleStatus.PUBLISHED,
                        List.of(EditorialFormat.COLUMN, EditorialFormat.REVIEW),
                        PageRequest.of(0, 4))
                .stream()
                .map(mapper::toPublicSummary)
                .toList();

        List<PublicArticleSummary> featuredReels = recentPublished.stream()
                .limit(6)
                .map(mapper::toPublicSummary)
                .toList();

        Map<Category, List<PublicArticleSummary>> categoryBlocks = new EnumMap<>(Category.class);
        for (Category cat : Category.values()) {
            List<PublicArticleSummary> items = articleRepository
                    .findByStatusAndCategoryOrderByPublishedAtDesc(
                            ArticleStatus.PUBLISHED, cat, PageRequest.of(0, 4))
                    .stream()
                    .map(mapper::toPublicSummary)
                    .toList();
            categoryBlocks.put(cat, items);
        }

        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Article> mostReadEntities = articleRepository
                .findByStatusAndPublishedAtGreaterThanEqualOrderByViewsCountDescPublishedAtDesc(
                        ArticleStatus.PUBLISHED, sevenDaysAgo, PageRequest.of(0, 5));
        if (mostReadEntities.size() < 5) {
            mostReadEntities = articleRepository.findByStatusOrderByViewsCountDescPublishedAtDesc(
                    ArticleStatus.PUBLISHED, PageRequest.of(0, 5));
        }
        List<PublicArticleSummary> mostRead = mostReadEntities.stream().map(mapper::toPublicSummary).toList();

        HomeResponse response = new HomeResponse(
                breakingTicker,
                mainHeadline,
                secondaryHeadlines,
                urgentNews,
                giroGeek,
                columnsAndReviews,
                featuredReels,
                categoryBlocks,
                mostRead,
                Instant.now()
        );
        cacheService.cacheHome(response);
        return response;
    }

    public PublicArticlePage searchPublishedArticles(
            String q,
            Category category,
            EditorialFormat format,
            int page,
            int size
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(50, Math.max(1, size));
        Pageable pageable = PageRequest.of(
                safePage, safeSize, Sort.by(Sort.Order.desc("publishedAt"), Sort.Order.desc("createdAt")));

        Specification<Article> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), ArticleStatus.PUBLISHED));

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (format != null) {
                predicates.add(cb.equal(root.get("editorialFormat"), format));
            }
            if (StringUtils.hasText(q)) {
                String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("headline")), pattern),
                        cb.like(cb.lower(root.get("lead")), pattern),
                        cb.like(cb.lower(root.get("sourceName")), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Page<Article> result = articleRepository.findAll(spec, pageable);
        return new PublicArticlePage(
                result.getContent().stream().map(mapper::toPublicSummary).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    public PublicArticleDetail getPublishedArticleBySlug(String slug, String visitorHash) {
        Article article = articleRepository.findBySlugAndStatus(slug, ArticleStatus.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada: " + slug));

        List<ArticleSource> sources = articleSourceRepository.findByArticleIdOrderByFetchedAtDesc(article.getId());
        List<Article> related = articleRepository.findByStatusAndCategoryAndIdNotOrderByPublishedAtDesc(
                ArticleStatus.PUBLISHED, article.getCategory(), article.getId(), PageRequest.of(0, 4));

        boolean liked = visitorHash != null && interactionRepository
                .existsByArticleIdAndVisitorHashAndInteractionType(article.getId(), visitorHash, InteractionType.LIKE);
        boolean saved = visitorHash != null && interactionRepository
                .existsByArticleIdAndVisitorHashAndInteractionType(article.getId(), visitorHash, InteractionType.SAVE);

        return mapper.toPublicDetail(article, sources, related, liked, saved);
    }

    public ReelsFeedResponse getReelsFeed(Category category, String focusSlug, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(30, Math.max(1, size));
        Pageable pageable = PageRequest.of(
                safePage, safeSize, Sort.by(Sort.Order.desc("publishedAt"), Sort.Order.desc("createdAt")));

        Page<Article> pageResult = category != null
                ? articleRepository.findPageByStatusAndCategoryOrderByPublishedAtDesc(ArticleStatus.PUBLISHED, category, pageable)
                : articleRepository.findByStatusOrderByPublishedAtDesc(ArticleStatus.PUBLISHED, pageable);

        List<PublicArticleSummary> items = new ArrayList<>(
                pageResult.getContent().stream().map(mapper::toPublicSummary).toList());

        boolean focusSlugFound = false;
        if (safePage == 0 && StringUtils.hasText(focusSlug)) {
            Optional<Article> focusedOpt = articleRepository.findBySlugAndStatus(focusSlug.trim(), ArticleStatus.PUBLISHED);
            if (focusedOpt.isPresent()) {
                Article focused = focusedOpt.get();
                if (category == null || focused.getCategory() == category) {
                    focusSlugFound = true;
                    items.removeIf(item -> item.id().equals(focused.getId()));
                    items.add(0, mapper.toPublicSummary(focused));
                    if (items.size() > safeSize) {
                        items = items.subList(0, safeSize);
                    }
                }
            }
        }

        return new ReelsFeedResponse(
                items,
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.getTotalElements(),
                pageResult.hasNext(),
                focusSlugFound
        );
    }
}
