package br.com.crithit.api.repository;

import br.com.crithit.api.domain.entity.NewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, UUID> {
    Optional<NewsletterSubscriber> findByEmailIgnoreCase(String email);
}
