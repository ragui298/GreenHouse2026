package com.greenhouse.backend.transaccion.dto;

import com.greenhouse.backend.transaccion.TipoTransaccion;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class TransaccionRequest {

    @NotNull
    private Long clienteId;

    @NotNull
    private TipoTransaccion tipo;

    // Si viene con detalles (productos), el monto se calcula solo.
    // Si no hay detalles (ej. un abono simple), se usa este monto directo.
    @Positive
    private BigDecimal monto;

    private String descripcion;

    private List<DetalleRequest> detalles;
}
