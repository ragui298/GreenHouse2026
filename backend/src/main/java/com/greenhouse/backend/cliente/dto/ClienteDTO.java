package com.greenhouse.backend.cliente.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    private Long id;
    private String nombre;
    private String telefono;
    private String cedula;
    private Boolean activo;
    private BigDecimal saldoActual; // positivo = debe dinero
}
