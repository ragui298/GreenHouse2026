package com.greenhouse.backend.transaccion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.greenhouse.backend.cliente.Cliente;
import com.greenhouse.backend.config.ZonaHoraria;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transacciones", indexes = {
        // El saldo de un cliente (calcularSaldo) y el saldo inicial de una
        // semana (calcularSaldosPorClienteAntesDe) filtran por cliente_id;
        // el reporte semanal y la exportación filtran por fecha. Sin estos
        // índices, esas consultas recorren toda la tabla -- hoy es chica y
        // no se nota, pero con años de historial sí importa. Se agregan acá
        // (no como SQL manual) porque ddl-auto=update los crea solo.
        @Index(name = "idx_transacciones_cliente_id", columnList = "cliente_id"),
        @Index(name = "idx_transacciones_fecha", columnList = "fecha")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties({"transacciones"})
    private Cliente cliente;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoTransaccion tipo;

    @NotNull
    @Positive
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    private String descripcion;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha = LocalDateTime.now(ZonaHoraria.COSTA_RICA);

    @Builder.Default
    @OneToMany(mappedBy = "transaccion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleTransaccion> detalles = new ArrayList<>();
}
