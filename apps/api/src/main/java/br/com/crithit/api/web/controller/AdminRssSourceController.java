package br.com.crithit.api.web.controller;

import br.com.crithit.api.service.AdminRssSourceService;
import br.com.crithit.api.web.dto.CreateRssSourceRequest;
import br.com.crithit.api.web.dto.RssSourceDto;
import br.com.crithit.api.web.dto.RssTriggerResponse;
import br.com.crithit.api.web.dto.UpdateRssSourceRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/rss-sources")
public class AdminRssSourceController {

    private final AdminRssSourceService rssSourceService;

    public AdminRssSourceController(AdminRssSourceService rssSourceService) {
        this.rssSourceService = rssSourceService;
    }

    @GetMapping
    public ResponseEntity<List<RssSourceDto>> listAll() {
        return ResponseEntity.ok(rssSourceService.listAll());
    }

    @PostMapping
    public ResponseEntity<RssSourceDto> create(@Valid @RequestBody CreateRssSourceRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(rssSourceService.create(body));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<RssSourceDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRssSourceRequest body
    ) {
        return ResponseEntity.ok(rssSourceService.update(id, body));
    }

    @PostMapping("/trigger")
    public ResponseEntity<RssTriggerResponse> trigger(@RequestParam(required = false) UUID sourceId) {
        return ResponseEntity.accepted().body(rssSourceService.triggerIngestion(sourceId));
    }
}
