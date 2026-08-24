package com.greenhouse.backend.transaccion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    List<Transaccion> findByCliente_IdOrderByFechaDesc(Long clienteId);

    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN t.tipo = com.greenhouse.backend.transaccion.TipoTransaccion.CARGO THEN t.monto
                 ELSE -t.monto END
        ), 0)
        FROM Transaccion t
        WHERE t.cliente.id = :clienteId
    """)
    BigDecimal calcularSaldo(@Param("clienteId") Long clienteId);

    List<Transaccion> findAllByOrderByFechaDesc();
}
