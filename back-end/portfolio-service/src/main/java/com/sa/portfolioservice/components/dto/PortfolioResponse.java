package com.sa.portfolioservice.components.dto;

import com.sa.portfolioservice.components.dto.HoldingResponse;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioResponse {
    private List<HoldingResponse> holdings;
    private BigDecimal totalMarketValue;
}
