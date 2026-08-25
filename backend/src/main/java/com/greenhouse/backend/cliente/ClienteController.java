package com.greenhouse.backend.cliente;

import com.greenhouse.backend.cliente.dto.ClienteDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@PreAuthorize("@permisoService.tieneAcceso('CLIENTES')")
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public List<ClienteDTO> listar(@RequestParam(name = "nombre", required = false) String nombre) {
        if (nombre != null && !nombre.isBlank()) {
            return clienteService.buscar(nombre);
        }
        return clienteService.listarConSaldo();
    }

    @GetMapping("/{id}")
    public ClienteDTO obtener(@PathVariable("id") Long id) {
        return clienteService.obtenerConSaldo(id);
    }

    @PostMapping
    @PreAuthorize("@permisoService.tieneAcceso('MANTENIMIENTO_CLIENTES')")
    public ResponseEntity<Cliente> crear(@Valid @RequestBody Cliente cliente) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.crear(cliente));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permisoService.tieneAcceso('MANTENIMIENTO_CLIENTES')")
    public Cliente actualizar(@PathVariable("id") Long id, @Valid @RequestBody Cliente cliente) {
        return clienteService.actualizar(id, cliente);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permisoService.tieneAcceso('MANTENIMIENTO_CLIENTES')")
    public ResponseEntity<Void> desactivar(@PathVariable("id") Long id) {
        clienteService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
