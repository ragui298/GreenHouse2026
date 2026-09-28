package com.greenhouse.backend.transaccion.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Solo fecha y monto: cliente, tipo y productos no se editan. Si una
// transacción quedó con el cliente o el tipo equivocado, se elimina y se
// registra de nuevo.
@Data
public class TransaccionEditarRequest {

    @NotNull
    @Positive
    private BigDecimal monto;

    // Hora de Costa Rica, igual que la que se guarda al registrar.
    @NotNull
    private LocalDateTime fecha;
}
