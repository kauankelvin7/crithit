package br.com.crithit.api.repository;

import br.com.crithit.api.domain.entity.RssSource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RssSourceRepository extends JpaRepository<RssSource, UUID> {
    List<RssSource> findByActiveTrueOrderByNameAsc();
    List<RssSource> findAllByOrderByNameAsc();
    Optional<RssSource> findByFeedUrl(String feedUrl);
    boolean existsByFeedUrl(String feedUrl);
}
