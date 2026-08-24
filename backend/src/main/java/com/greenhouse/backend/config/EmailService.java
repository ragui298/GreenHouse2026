package com.greenhouse.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final RestClient restClient = RestClient.create("https://api.resend.com");

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    public void enviarCorreo(String destinatario, String asunto, String cuerpoHtml) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY no está configurada.");
        }

        Map<String, Object> body = Map.of(
                "from", fromEmail,
                "to", List.of(destinatario),
                "subject", asunto,
                "html", cuerpoHtml
        );

        restClient.post()
                .uri("/emails")
                .header("Authorization", "Bearer " + apiKey)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }
}
