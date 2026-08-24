package com.greenhouse.backend.transaccion;

public enum TipoTransaccion {
    CARGO,   // el cliente fía algo -> aumenta la deuda
    ABONO    // el cliente paga -> disminuye la deuda
}
