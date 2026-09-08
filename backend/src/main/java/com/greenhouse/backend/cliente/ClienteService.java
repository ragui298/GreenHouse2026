package com.greenhouse.backend.cliente;

import com.greenhouse.backend.cliente.dto.ClienteDTO;
import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.transaccion.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final TransaccionRepository transaccionRepository;

    public List<ClienteDTO> listarConSaldo() {
        Map<Long, BigDecimal> saldos = cargarSaldos();
        return clienteRepository.findByActivoTrue().stream()
                .map(c -> toDTO(c, saldos.getOrDefault(c.getId(), BigDecimal.ZERO)))
                .toList();
    }

    public ClienteDTO obtenerConSaldo(Long id) {
        Cliente cliente = obtener(id);
        return toDTO(cliente);
    }

    public Cliente obtener(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
    }

    public Cliente crear(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public Cliente actualizar(Long id, Cliente datos) {
        Cliente cliente = obtener(id);
        cliente.setNombre(datos.getNombre());
        cliente.setTelefono(datos.getTelefono());
        cliente.setCedula(datos.getCedula());
        cliente.setTipoCliente(datos.getTipoCliente());
        return clienteRepository.save(cliente);
    }

    public void desactivar(Long id) {
        Cliente cliente = obtener(id);
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    public List<ClienteDTO> buscar(String nombre) {
        Map<Long, BigDecimal> saldos = cargarSaldos();
        return clienteRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                .map(c -> toDTO(c, saldos.getOrDefault(c.getId(), BigDecimal.ZERO)))
                .toList();
    }

    private Map<Long, BigDecimal> cargarSaldos() {
        return transaccionRepository.calcularSaldosPorCliente().stream()
                .collect(Collectors.toMap(
                        fila -> (Long) fila[0],
                        fila -> (BigDecimal) fila[1]
                ));
    }

    private ClienteDTO toDTO(Cliente cliente) {
        return toDTO(cliente, transaccionRepository.calcularSaldo(cliente.getId()));
    }

    private ClienteDTO toDTO(Cliente cliente, BigDecimal saldo) {
        return ClienteDTO.builder()
                .id(cliente.getId())
                .nombre(cliente.getNombre())
                .telefono(cliente.getTelefono())
                .cedula(cliente.getCedula())
                .tipoCliente(cliente.getTipoCliente())
                .activo(cliente.getActivo())
                .saldoActual(saldo)
                .build();
    }
}
