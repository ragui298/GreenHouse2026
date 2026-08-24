package com.greenhouse.backend.transaccion.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class DetalleRequest {
    @NotNull
    private Long productoId;

    @NotNull
    @Positive
    private Integer cantidad;
}
