package com.sa.portfolioservice.components.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TickerPriceResponse {
    private String symbol;
    private BigDecimal price;
}
