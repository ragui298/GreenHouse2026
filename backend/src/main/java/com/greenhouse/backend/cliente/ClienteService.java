package com.greenhouse.backend.cliente;

import com.greenhouse.backend.cliente.dto.ClienteDTO;
import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.transaccion.TransaccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final TransaccionRepository transaccionRepository;

    public List<ClienteDTO> listarConSaldo() {
        return clienteRepository.findByActivoTrue().stream()
                .map(this::toDTO)
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
        return clienteRepository.save(cliente);
    }

    public void desactivar(Long id) {
        Cliente cliente = obtener(id);
        cliente.setActivo(false);
        clienteRepository.save(cliente);
    }

    public List<ClienteDTO> buscar(String nombre) {
        return clienteRepository.findByNombreContainingIgnoreCaseAndActivoTrue(nombre).stream()
                .map(this::toDTO)
                .toList();
    }

    private ClienteDTO toDTO(Cliente cliente) {
        return ClienteDTO.builder()
                .id(cliente.getId())
                .nombre(cliente.getNombre())
                .telefono(cliente.getTelefono())
                .cedula(cliente.getCedula())
                .activo(cliente.getActivo())
                .saldoActual(transaccionRepository.calcularSaldo(cliente.getId()))
                .build();
    }
}
