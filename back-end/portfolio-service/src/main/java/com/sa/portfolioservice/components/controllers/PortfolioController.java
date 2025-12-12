package com.sa.portfolioservice.components.controllers;

import com.sa.portfolioservice.components.entities.PortfolioItem;
import com.sa.portfolioservice.components.dto.AddHoldingRequest;
import com.sa.portfolioservice.components.dto.PortfolioResponse;
import com.sa.portfolioservice.components.services.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService service;

    /**
     * Add or update a holding for a user.
     * Example:
     * POST /portfolio/{userId}/holdings
     * body: { "symbol": "AAPL", "quantity": 1.5, "buyPrice": 170 }
     */
    @PostMapping("/{userId}/holdings")
    public ResponseEntity<PortfolioItem> addHolding(
            @PathVariable("userId") UUID userId,
            @RequestBody AddHoldingRequest request) {

        PortfolioItem saved = service.addOrUpdateHolding(userId, request);
        return ResponseEntity.ok(saved);
    }

    /**
     * Remove a holding.
     * DELETE /portfolio/{userId}/holdings/{symbol}
     */
    @DeleteMapping("/{userId}/holdings/{symbol}")
    public ResponseEntity<Void> removeHolding(@PathVariable("userId") UUID userId,
                                              @PathVariable("symbol") String symbol) {
        service.removeHolding(userId, symbol);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get portfolio without current market values.
     * GET /portfolio/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<PortfolioResponse> getPortfolio(@PathVariable("userId") UUID userId) {
        PortfolioResponse response = service.getPortfolio(userId);
        return ResponseEntity.ok(response);
    }
}
