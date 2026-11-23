package br.com.crithit.api.service;

import br.com.crithit.api.config.AppProperties;
import br.com.crithit.api.rss.RssIngestionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledArticlePublisher {

    private static final Logger log = LoggerFactory.getLogger(ScheduledArticlePublisher.class);

    private final AdminArticleService adminArticleService;
    private final RssIngestionService rssIngestionService;
    private final AppProperties properties;

    public ScheduledArticlePublisher(
            AdminArticleService adminArticleService,
            RssIngestionService rssIngestionService,
            AppProperties properties
    ) {
        this.adminArticleService = adminArticleService;
        this.rssIngestionService = rssIngestionService;
        this.properties = properties;
    }

    /**
     * Checks every 30 seconds for SCHEDULED articles whose scheduledAt <= now.
     */
    @Scheduled(fixedDelay = 30_000, initialDelay = 15_000)
    public void publishScheduledArticles() {
        try {
            int published = adminArticleService.publishDueScheduledArticles();
            if (published > 0) {
                log.info("Scheduled publisher promoted {} article(s) to PUBLISHED", published);
            }
        } catch (Exception ex) {
            log.error("Error running scheduled article publisher: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Periodically ingests all active RSS feeds (default every 15 minutes).
     */
    @Scheduled(cron = "${crithit.rss.cron:0 */15 * * * *}")
    public void runRssIngestionCycle() {
        if (!properties.rss().enabled()) {
            return;
        }
        try {
            log.info("Starting scheduled RSS ingestion cycle on Virtual Threads");
            rssIngestionService.ingestAllActiveSources();
        } catch (Exception ex) {
            log.error("Scheduled RSS ingestion cycle failed: {}", ex.getMessage(), ex);
        }
    }
}
