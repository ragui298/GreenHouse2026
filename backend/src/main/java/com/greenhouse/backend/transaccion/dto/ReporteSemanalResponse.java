package com.greenhouse.backend.transaccion.dto;

import com.greenhouse.backend.transaccion.Transaccion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Respuesta de GET /api/transacciones/reporte cuando se pide un rango de
 * fechas: las transacciones de ese rango, más el saldo que cada cliente ya
 * arrastraba de ANTES de "desde" (el "saldo inicial" de la semana).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReporteSemanalResponse {
    private List<Transaccion> transacciones;
    private Map<Long, BigDecimal> saldosIniciales;
}
