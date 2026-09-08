package com.greenhouse.backend.config;

import java.time.ZoneId;

/**
 * Render corre los contenedores en UTC, no en la hora de Costa Rica. Si se
 * usa LocalDateTime.now() a secas, el valor guardado es la hora UTC pero sin
 * ninguna marca de zona -- al mostrarla en el navegador (que sí sabe que
 * está en Costa Rica), JavaScript la toma como si ya fuera hora local, y
 * termina mostrando 6 horas adelantado (ej. una transacción de la 1:43pm
 * aparecía como si fuera las 7:43pm).
 *
 * Se usa LocalDateTime.now(COSTA_RICA) en vez de LocalDateTime.now() en todo
 * lugar donde se guarda "el momento actual", para que el valor guardado ya
 * sea la hora de Costa Rica correcta, sin importar en qué zona esté el
 * servidor.
 */
public final class ZonaHoraria {

    public static final ZoneId COSTA_RICA = ZoneId.of("America/Costa_Rica");

    private ZonaHoraria() {
    }
}
