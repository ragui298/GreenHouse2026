package com.greenhouse.backend.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint público y liviano (no toca la base de datos) para que un
 * "ping" externo (ver .github/workflows/keep-alive.yml) mantenga despierta
 * la instancia gratuita de Render, que se duerme a los ~15 minutos sin
 * tráfico.
 */
@RestController
public class SaludController {

    @GetMapping("/api/salud")
    public String salud() {
        return "ok";
    }
}
