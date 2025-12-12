package com.sa.portfolioservice.components.services;

import com.sa.portfolioservice.components.entities.PortfolioItem;
import com.sa.portfolioservice.components.entities.PortfolioRepository;
import com.sa.portfolioservice.components.dto.AddHoldingRequest;
import com.sa.portfolioservice.components.dto.PortfolioResponse;
import com.sa.portfolioservice.components.dto.HoldingResponse;
import jakarta.transaction.Transactional;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository repository;

    /**
     * Add or update a holding for a user. If an existing holding exists,
     * average the price and sum quantities (weighted average).
     */
    @Transactional
    public PortfolioItem addOrUpdateHolding(UUID userId, AddHoldingRequest req) {
        if (req.getQuantity() == null || req.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("quantity must be > 0");
        }
        if (req.getSymbol() == null || req.getSymbol().isBlank()) {
            throw new IllegalArgumentException("symbol is required");
        }

        String symbol = req.getSymbol().toUpperCase(Locale.ROOT).trim();
        BigDecimal quantityToAdd = req.getQuantity();
        BigDecimal buyPrice = req.getBuyPrice() == null ? BigDecimal.ZERO : req.getBuyPrice();

        Optional<PortfolioItem> existingOpt = repository.findByUserIdAndSymbolIgnoreCase(userId, symbol);

        if (existingOpt.isPresent()) {
            PortfolioItem existing = existingOpt.get();
            BigDecimal oldQty = existing.getQuantity();
            BigDecimal oldAvg = existing.getAveragePrice();

            BigDecimal newQty = oldQty.add(quantityToAdd);
            BigDecimal newAvg = (buyPrice.compareTo(BigDecimal.ZERO) <= 0) ?
                    oldAvg :
                    (oldAvg.multiply(oldQty).add(buyPrice.multiply(quantityToAdd))).divide(newQty,
                                                                                           8,
                                                                                           RoundingMode.HALF_UP);

            existing.setQuantity(newQty);
            existing.setAveragePrice(newAvg);
            return repository.save(existing);
        } else {
            PortfolioItem item = PortfolioItem.builder()
                    .userId(userId)
                    .symbol(symbol)
                    .quantity(quantityToAdd)
                    .averagePrice(buyPrice.compareTo(BigDecimal.ZERO) <= 0 ? BigDecimal.ZERO : buyPrice)
                    .build();
            return repository.save(item);
        }
    }

    @Transactional
    public void removeHolding(UUID userId, String symbol) {
        if (symbol == null || symbol.isBlank()) throw new IllegalArgumentException("symbol is required");
        repository.deleteByUserIdAndSymbolIgnoreCase(userId, symbol.trim().toUpperCase(Locale.ROOT));
    }

    public List<PortfolioItem> getHoldings(UUID userId) {
        return repository.findByUserId(userId);
    }

    /**
     * Return portfolio.
     */
    public PortfolioResponse getPortfolio(UUID userId) {
        List<PortfolioItem> items = getHoldings(userId);

        List<HoldingResponse> holdings = items.stream()
                .map(item -> HoldingResponse.builder()
                        .symbol(item.getSymbol())
                        .quantity(item.getQuantity())
                        .averagePrice(item.getAveragePrice())
                        .build())
                .collect(Collectors.toList());

        BigDecimal total = holdings.stream()
                .map(HoldingResponse::getAveragePrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return PortfolioResponse.builder()
                .holdings(holdings)
                .totalMarketValue(total) // for now, just sum of purchase prices
                .build();
    }
}
