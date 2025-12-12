package com.sa.gateway.config;

import com.sa.gateway.util.JwtUtil;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import reactor.core.publisher.Mono;

@Component
public class ForwardAuthHeaderFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    public ForwardAuthHeaderFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        ServerHttpRequest.Builder mutate = exchange.getRequest().mutate();

        if (authHeader != null) {
            // ensure Authorization is present on proxied request
            mutate.header(HttpHeaders.AUTHORIZATION, authHeader);

            // also set a forwarded copy so downstream can clearly see it was forwarded
            mutate.header("X-Forwarded-Authorization", authHeader);

            // optionally add a derived header (email) so downstream can avoid repeated JWT parsing
            try {
                if (authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    if (jwtUtil.validateToken(token)) {
                        String email = jwtUtil.extractEmail(token);
                        if (email != null) {
                            mutate.header("X-User-Email", email);
                        }
                    }
                }
            } catch (Exception e) {
            }
        }

        ServerHttpRequest newReq = mutate.build();
        ServerWebExchange newExchange = exchange.mutate().request(newReq).build();
        return chain.filter(newExchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
