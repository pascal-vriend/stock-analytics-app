package com.sa.portfolioservice.components.entities;

import com.sa.portfolioservice.components.entities.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortfolioRepository extends JpaRepository<PortfolioItem, UUID> {
    List<PortfolioItem> findByUserId(UUID userId);
    Optional<PortfolioItem> findByUserIdAndSymbolIgnoreCase(UUID userId, String symbol);
    void deleteByUserIdAndSymbolIgnoreCase(UUID userId, String symbol);
}
