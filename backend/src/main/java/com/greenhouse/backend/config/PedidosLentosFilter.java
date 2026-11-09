package com.greenhouse.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Anota en el log todo pedido que tarde más de UMBRAL_MS: método, ruta,
 * parámetros, usuario, código de respuesta, duración y cuántos pedidos había
 * en curso al mismo tiempo.
 *
 * El plan gratuito de Render no muestra CPU ni memoria, y el backend no
 * registraba qué pedidos recibía, así que cuando la instancia se trababa por
 * ratos (ej. 9/11/2026 14:49-15:00, pedidos colgados 60 s sin ningún error en
 * los logs) no había forma de saber qué lo había causado. Con esto, la
 * próxima vez los logs de Render dicen qué pantalla pidió qué y cuánto tardó.
 *
 * Va primero en la cadena de filtros para medir también lo que tarda la
 * seguridad (validar el token consulta la base).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class PedidosLentosFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(PedidosLentosFilter.class);
    private static final long UMBRAL_MS = 3000;

    private static final AtomicInteger enCurso = new AtomicInteger();

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        long inicio = System.nanoTime();
        int simultaneos = enCurso.incrementAndGet();
        try {
            filterChain.doFilter(request, response);
        } finally {
            enCurso.decrementAndGet();
            long ms = (System.nanoTime() - inicio) / 1_000_000;
            if (ms >= UMBRAL_MS) {
                String query = request.getQueryString();
                log.warn("Pedido lento: {} {}{} usuario={} status={} {} ms (pedidos en curso al empezar: {})",
                        request.getMethod(),
                        request.getRequestURI(),
                        query != null ? "?" + query : "",
                        usuario(request),
                        response.getStatus(),
                        ms,
                        simultaneos);
            }
        }
    }

    // Solo para el log: el contexto de seguridad ya se limpió cuando termina
    // la cadena, así que se lee el usuario directo del token.
    private String usuario(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "-";
        }
        try {
            return jwtUtil.extractUsername(authHeader.substring(7));
        } catch (Exception e) {
            return "token-invalido";
        }
    }
}
