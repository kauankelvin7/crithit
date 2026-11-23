package br.com.crithit.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;

import java.time.Duration;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Configures Java 21 Virtual Threads executors for RSS ingestion and async webhook revalidation.
 */
@Configuration
public class ExecutorConfig {

    @Bean(name = "rssVirtualThreadExecutor", destroyMethod = "close")
    public ExecutorService rssVirtualThreadExecutor() {
        return Executors.newThreadPerTaskExecutor(
                Thread.ofVirtual().name("rss-vt-", 0).factory()
        );
    }

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("crithit-async-");
        executor.setVirtualThreads(true);
        executor.setTaskTerminationTimeout(Duration.ofSeconds(10).toMillis());
        return executor;
    }
}
