package com.sa.gateway.util;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Client service to communicate internally with the Python Gemini Agent service.
 * Uses the internal Docker Compose service name 'agent' and internal port '8001'.
 */
@Service
public class AgentClient {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // Use the Docker service name as the base URL
    private static final String AGENT_BASE_URL = "http://agent:8001";
    private static final String GENERATE_ENDPOINT = "/generate";

    public AgentClient(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        // Initialize WebClient instance pointing to the internal agent service
        this.webClient = webClientBuilder.baseUrl(AGENT_BASE_URL).build();
        this.objectMapper = objectMapper;
    }

    /**
     * Data class to hold the request sent to the Python agent.
     */
    public record AgentRequest(String prompt) {}

    /**
     * Data class to hold the response received from the Python agent.
     */
    public record AgentResponse(String text, List<Source> sources) {
        public record Source(String uri, String title) {}
    }


    /**
     * Calls the internal /generate endpoint on the Gemini Agent service.
     *
     * @param userPrompt The prompt to send to the AI model.
     * @return A Mono emitting the response data from the AI.
     */
    public Mono<AgentResponse> generateResponseFromAgent(String userPrompt) {

        AgentRequest requestBody = new AgentRequest(userPrompt);

        //

        return webClient.post()
                .uri(GENERATE_ENDPOINT)
                .bodyValue(requestBody)
                .retrieve()
                // Map 4xx and 5xx errors to a custom exception if needed,
                // but for now, we just let WebClient throw WebClientResponseException
                .bodyToMono(JsonNode.class)
                .map(this::processAgentResponse)
                .onErrorResume(e -> {
                    System.err.println("Error calling Gemini Agent Service at " + AGENT_BASE_URL + GENERATE_ENDPOINT + ": " + e.getMessage());
                    return Mono.just(new AgentResponse(
                            "Error: Could not reach internal AI service or received an invalid response.",
                            Collections.emptyList()
                    ));
                });
    }

    /**
     * Converts the raw JsonNode response from the Python agent into the structured AgentResponse record.
     */
    private AgentResponse processAgentResponse(JsonNode jsonNode) {
        try {
            String text = jsonNode.get("text").asText();
            JsonNode sourcesNode = jsonNode.get("sources");

            List<AgentResponse.Source> sources = sourcesNode != null && sourcesNode.isArray()
                    ? objectMapper.convertValue(sourcesNode, objectMapper.getTypeFactory().constructCollectionType(List.class, AgentResponse.Source.class))
                    : Collections.emptyList();

            return new AgentResponse(text, sources);
        } catch (Exception e) {
            System.err.println("Failed to parse agent response: " + e.getMessage());
            return new AgentResponse("Error: Failed to parse AI response structure.", Collections.emptyList());
        }
    }
}