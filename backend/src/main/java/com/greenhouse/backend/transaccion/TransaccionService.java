package com.greenhouse.backend.transaccion;

import com.greenhouse.backend.cliente.Cliente;
import com.greenhouse.backend.cliente.ClienteRepository;
import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.producto.Producto;
import com.greenhouse.backend.producto.ProductoRepository;
import com.greenhouse.backend.transaccion.dto.DetalleRequest;
import com.greenhouse.backend.transaccion.dto.TransaccionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransaccionService {

    private final TransaccionRepository transaccionRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;

    @Transactional
    public Transaccion registrar(TransaccionRequest request) {
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + request.getClienteId()));

        Transaccion transaccion = Transaccion.builder()
                .cliente(cliente)
                .tipo(request.getTipo())
                .descripcion(request.getDescripcion())
                .build();

        List<DetalleTransaccion> detalles = new ArrayList<>();
        BigDecimal montoCalculado = BigDecimal.ZERO;

        if (request.getDetalles() != null && !request.getDetalles().isEmpty()) {
            for (DetalleRequest d : request.getDetalles()) {
                Producto producto = productoRepository.findById(d.getProductoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + d.getProductoId()));

                BigDecimal subtotal = producto.getPrecio().multiply(BigDecimal.valueOf(d.getCantidad()));
                montoCalculado = montoCalculado.add(subtotal);

                detalles.add(DetalleTransaccion.builder()
                        .transaccion(transaccion)
                        .producto(producto)
                        .cantidad(d.getCantidad())
                        .subtotal(subtotal)
                        .build());
            }
            transaccion.setMonto(montoCalculado);
        } else {
            if (request.getMonto() == null) {
                throw new IllegalArgumentException("Debe indicar un monto o una lista de productos");
            }
            transaccion.setMonto(request.getMonto());
        }

        transaccion.setDetalles(detalles);
        return transaccionRepository.save(transaccion);
    }

    public List<Transaccion> historialCliente(Long clienteId) {
        return transaccionRepository.findByCliente_IdOrderByFechaDesc(clienteId);
    }

    public List<Transaccion> listarTodas() {
        return transaccionRepository.findAllByOrderByFechaDesc();
    }

    public BigDecimal saldoCliente(Long clienteId) {
        return transaccionRepository.calcularSaldo(clienteId);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!transaccionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Transacción no encontrada: " + id);
        }
        transaccionRepository.deleteById(id);
    }
}
