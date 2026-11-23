package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.RssSource;
import br.com.crithit.api.repository.RssSourceRepository;
import br.com.crithit.api.rss.RssIngestionService;
import br.com.crithit.api.security.HtmlSanitizer;
import br.com.crithit.api.security.UrlSecurityValidator;
import br.com.crithit.api.web.dto.CreateRssSourceRequest;
import br.com.crithit.api.web.dto.RssSourceDto;
import br.com.crithit.api.web.dto.RssTriggerResponse;
import br.com.crithit.api.web.dto.UpdateRssSourceRequest;
import br.com.crithit.api.web.exception.BusinessValidationException;
import br.com.crithit.api.web.exception.ConflictException;
import br.com.crithit.api.web.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AdminRssSourceService {

    private final RssSourceRepository rssSourceRepository;
    private final RssIngestionService rssIngestionService;
    private final UrlSecurityValidator urlSecurityValidator;
    private final HtmlSanitizer htmlSanitizer;

    public AdminRssSourceService(
            RssSourceRepository rssSourceRepository,
            RssIngestionService rssIngestionService,
            UrlSecurityValidator urlSecurityValidator,
            HtmlSanitizer htmlSanitizer
    ) {
        this.rssSourceRepository = rssSourceRepository;
        this.rssIngestionService = rssIngestionService;
        this.urlSecurityValidator = urlSecurityValidator;
        this.htmlSanitizer = htmlSanitizer;
    }

    @Transactional(readOnly = true)
    public List<RssSourceDto> listAll() {
        return rssSourceRepository.findAllByOrderByNameAsc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public RssSourceDto create(CreateRssSourceRequest request) {
        String feedUrl = request.feedUrl().trim();
        String siteUrl = request.siteUrl().trim();
        validateUrls(feedUrl, siteUrl);

        if (rssSourceRepository.existsByFeedUrl(feedUrl)) {
            throw new ConflictException("Já existe uma fonte RSS cadastrada com esta feedUrl");
        }

        RssSource source = new RssSource();
        source.setName(htmlSanitizer.stripAllHtml(request.name()));
        source.setFeedUrl(feedUrl);
        source.setSiteUrl(siteUrl);
        source.setLanguage(request.language());
        source.setDefaultCategory(request.defaultCategory());
        source.setActive(request.active() == null || request.active());

        return toDto(rssSourceRepository.save(source));
    }

    @Transactional
    public RssSourceDto update(UUID id, UpdateRssSourceRequest request) {
        RssSource source = rssSourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fonte RSS não encontrada: " + id));

        if (StringUtils.hasText(request.name())) {
            source.setName(htmlSanitizer.stripAllHtml(request.name()));
        }
        if (StringUtils.hasText(request.feedUrl())) {
            String newFeedUrl = request.feedUrl().trim();
            if (!urlSecurityValidator.isValidHttpUrl(newFeedUrl)) {
                throw new BusinessValidationException("feedUrl deve usar esquema http:// ou https://");
            }
            rssSourceRepository.findByFeedUrl(newFeedUrl)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new ConflictException("Outra fonte RSS já utiliza esta feedUrl");
                    });
            source.setFeedUrl(newFeedUrl);
        }
        if (StringUtils.hasText(request.siteUrl())) {
            String newSiteUrl = request.siteUrl().trim();
            if (!urlSecurityValidator.isValidHttpUrl(newSiteUrl)) {
                throw new BusinessValidationException("siteUrl deve usar esquema http:// ou https://");
            }
            source.setSiteUrl(newSiteUrl);
        }
        if (StringUtils.hasText(request.language())) {
            source.setLanguage(request.language());
        }
        if (request.defaultCategory() != null) {
            source.setDefaultCategory(request.defaultCategory());
        }
        if (request.active() != null) {
            source.setActive(request.active());
            if (request.active()) {
                source.setConsecutiveFailures(0);
                source.setCircuitOpenUntil(null);
            }
        }

        return toDto(rssSourceRepository.save(source));
    }

    public RssTriggerResponse triggerIngestion(UUID sourceId) {
        if (sourceId != null && !rssSourceRepository.existsById(sourceId)) {
            throw new ResourceNotFoundException("Fonte RSS não encontrada: " + sourceId);
        }
        rssIngestionService.triggerAsyncIngestion(sourceId);
        String msg = sourceId != null
                ? "Coleta RSS iniciada em segundo plano para a fonte " + sourceId
                : "Coleta RSS iniciada em segundo plano para todas as fontes ativas";
        return new RssTriggerResponse(true, msg, Instant.now());
    }

    private void validateUrls(String feedUrl, String siteUrl) {
        if (!urlSecurityValidator.isValidHttpUrl(feedUrl) || !urlSecurityValidator.isValidHttpUrl(siteUrl)) {
            throw new BusinessValidationException("feedUrl e siteUrl devem usar protocolo http:// ou https:// válido");
        }
    }

    private RssSourceDto toDto(RssSource s) {
        return new RssSourceDto(
                s.getId(),
                s.getName(),
                s.getFeedUrl(),
                s.getSiteUrl(),
                s.getLanguage(),
                s.getDefaultCategory(),
                s.isActive(),
                s.getConsecutiveFailures(),
                s.getCircuitOpenUntil(),
                s.getLastFetchedAt(),
                s.getLastErrorMessage()
        );
    }
}
