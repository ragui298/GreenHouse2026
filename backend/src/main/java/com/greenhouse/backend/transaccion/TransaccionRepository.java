package com.greenhouse.backend.transaccion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    // Trae cliente + detalles + producto en la misma consulta (JOIN FETCH),
    // en vez de dejar que Hibernate los cargue perezosamente uno por uno al
    // serializar el JSON. Sin esto, listar transacciones dispara una
    // consulta extra por cada transaccion (por su cliente) más otra por
    // cada detalle (por su producto) -- con solo 44 transacciones ya
    // tardaba ~3 segundos por esto.
    @Query("""
        SELECT DISTINCT t FROM Transaccion t
        LEFT JOIN FETCH t.cliente
        LEFT JOIN FETCH t.detalles d
        LEFT JOIN FETCH d.producto
        ORDER BY t.fecha DESC
    """)
    List<Transaccion> findAllConDetallesOrderByFechaDesc();

    // Para exportar a Excel: mismo JOIN FETCH de arriba, pero acotado al
    // rango de fechas pedido (en vez de traer todo el historial y filtrar
    // en memoria), para que exportar un mes puntual no dependa del tamaño
    // total del historial.
    @Query("""
        SELECT DISTINCT t FROM Transaccion t
        LEFT JOIN FETCH t.cliente
        LEFT JOIN FETCH t.detalles d
        LEFT JOIN FETCH d.producto
        WHERE t.fecha >= :desde AND t.fecha <= :hasta
        ORDER BY t.fecha ASC
    """)
    List<Transaccion> findConDetallesEntreFechas(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    // Saldo acumulado de cada cliente hasta ANTES de una fecha (todo lo de
    // semanas previas, sin contar la semana que se está reportando). Es lo
    // que el reporte semanal muestra como "saldo inicial": lo que el
    // cliente ya arrastraba antes de esta semana.
    @Query("""
        SELECT t.cliente.id, COALESCE(SUM(
            CASE WHEN t.tipo = com.greenhouse.backend.transaccion.TipoTransaccion.CARGO THEN t.monto
                 ELSE -t.monto END
        ), 0)
        FROM Transaccion t
        WHERE t.fecha < :antesDe
        GROUP BY t.cliente.id
    """)
    List<Object[]> calcularSaldosPorClienteAntesDe(@Param("antesDe") LocalDateTime antesDe);
}
