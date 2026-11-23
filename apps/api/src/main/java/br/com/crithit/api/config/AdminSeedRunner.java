package br.com.crithit.api.config;

import br.com.crithit.api.domain.entity.User;
import br.com.crithit.api.domain.enums.UserRole;
import br.com.crithit.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * Seeds the initial admin user from environment variables ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD
 * using BCryptPasswordEncoder without any hardcoded password fallback.
 */
@Component
public class AdminSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeedRunner.class);

    private final AppProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeedRunner(
            AppProperties properties,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AppProperties.AdminSeedProperties seed = properties.adminSeed();
        if (seed == null || !StringUtils.hasText(seed.email()) || !StringUtils.hasText(seed.password())) {
            log.warn("ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD not configured; skipping initial admin seed.");
            return;
        }

        String normalizedEmail = seed.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.debug("Initial admin user already exists: {}", normalizedEmail);
            return;
        }

        String displayName = StringUtils.hasText(seed.displayName())
                ? seed.displayName().trim()
                : "Editor-Chefe";
        if (displayName.length() < 2) {
            displayName = "Editor-Chefe";
        }

        User admin = new User();
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(seed.password()));
        admin.setDisplayName(displayName);
        admin.setRole(UserRole.ROLE_ADMIN);
        admin.setActive(true);
        userRepository.save(admin);

        log.info("Seeded initial editorial admin user: {}", normalizedEmail);
    }
}
