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

    // Saldo de TODOS los clientes en una sola consulta (GROUP BY), en vez de
    // una consulta por cliente. Antes, listar clientes hacía una consulta a
    // calcularSaldo() por cada uno -- con 170 clientes eso son 170 viajes
    // separados a la base (Neon), unos 10 segundos en total. Con esto es
    // una sola consulta sin importar cuántos clientes haya.
    @Query("""
        SELECT t.cliente.id, COALESCE(SUM(
            CASE WHEN t.tipo = com.greenhouse.backend.transaccion.TipoTransaccion.CARGO THEN t.monto
                 ELSE -t.monto END
        ), 0)
        FROM Transaccion t
        GROUP BY t.cliente.id
    """)
    List<Object[]> calcularSaldosPorCliente();

    List<Transaccion> findAllByOrderByFechaDesc();
}
