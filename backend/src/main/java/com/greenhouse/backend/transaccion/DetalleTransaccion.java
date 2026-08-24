package com.greenhouse.backend.transaccion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.greenhouse.backend.producto.Producto;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "detalle_transaccion")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetalleTransaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaccion_id", nullable = false)
    @JsonIgnoreProperties({"detalles", "cliente"})
    private Transaccion transaccion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @NotNull
    @Positive
    private Integer cantidad;

    @NotNull
    @Positive
    @Column(precision = 12, scale = 2)
    private BigDecimal subtotal;
}
