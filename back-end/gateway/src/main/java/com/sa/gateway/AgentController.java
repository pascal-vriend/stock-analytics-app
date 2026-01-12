package com.sa.gateway;

import com.sa.gateway.util.AgentClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import com.sa.gateway.util.AgentClient;

/**
 * Controller to handle external requests for AI/Agent functionality.
 * It uses the AgentClient to make internal, non-routed calls to the Python service.
 */
@RestController
@RequestMapping("/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentClient agentClient;


    /**
     * Request body structure for the query.
     */
    public record AiQueryRequest(String prompt) {}

    /**
     * Handles POST requests to run an AI query.
     * @param request The user's prompt.
     * @return A Mono that gives the structured response from the AI.
     */
    @PostMapping("/query")
    public Mono<AgentClient.AgentResponse> getAiResponse(@RequestBody AiQueryRequest request) {
        return agentClient.generateResponseFromAgent(request.prompt());
    }
}