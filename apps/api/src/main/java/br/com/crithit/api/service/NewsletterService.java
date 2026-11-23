package br.com.crithit.api.service;

import br.com.crithit.api.domain.entity.NewsletterSubscriber;
import br.com.crithit.api.domain.enums.NewsletterStatus;
import br.com.crithit.api.repository.NewsletterSubscriberRepository;
import br.com.crithit.api.security.RateLimitService;
import br.com.crithit.api.web.dto.NewsletterSubscribeRequest;
import br.com.crithit.api.web.dto.NewsletterSubscribeResponse;
import br.com.crithit.api.web.exception.RateLimitExceededException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

@Service
public class NewsletterService {

    private final NewsletterSubscriberRepository repository;
    private final RateLimitService rateLimitService;

    public NewsletterService(NewsletterSubscriberRepository repository, RateLimitService rateLimitService) {
        this.repository = repository;
        this.rateLimitService = rateLimitService;
    }

    @Transactional
    public NewsletterSubscribeResponse subscribe(NewsletterSubscribeRequest request, String ipHash) {
        if (!rateLimitService.tryConsume("newsletter", ipHash, 5, Duration.ofMinutes(15))) {
            throw new RateLimitExceededException("Muitas tentativas de inscrição. Tente novamente em alguns minutos.");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        Optional<NewsletterSubscriber> existingOpt = repository.findByEmailIgnoreCase(email);
        if (existingOpt.isPresent()) {
            NewsletterSubscriber existing = existingOpt.get();
            if (existing.getStatus() == NewsletterStatus.ACTIVE) {
                return new NewsletterSubscribeResponse(
                        "ALREADY_SUBSCRIBED",
                        "Este e-mail já está inscrito no Loot Diário!"
                );
            }
            existing.setStatus(NewsletterStatus.ACTIVE);
            existing.setUnsubscribedAt(null);
            existing.setIpHash(ipHash);
            repository.save(existing);
            return new NewsletterSubscribeResponse(
                    "SUBSCRIBED",
                    "Inscrição no Loot Diário reativada com sucesso!"
            );
        }

        NewsletterSubscriber subscriber = new NewsletterSubscriber();
        subscriber.setEmail(email);
        subscriber.setStatus(NewsletterStatus.ACTIVE);
        subscriber.setSourceOrigin("HOME_LOOT_DIARIO");
        subscriber.setIpHash(ipHash);
        repository.save(subscriber);

        return new NewsletterSubscribeResponse(
                "SUBSCRIBED",
                "Inscrição no Loot Diário confirmada com sucesso!"
        );
    }
}
