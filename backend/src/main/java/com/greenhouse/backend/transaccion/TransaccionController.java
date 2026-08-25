package com.greenhouse.backend.transaccion;

import com.greenhouse.backend.transaccion.dto.TransaccionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/transacciones")
@RequiredArgsConstructor
@PreAuthorize("@permisoService.tieneAcceso('TRANSACCIONES')")
public class TransaccionController {

    private final TransaccionService transaccionService;

    @PostMapping
    public ResponseEntity<Transaccion> registrar(@Valid @RequestBody TransaccionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionService.registrar(request));
    }

    @GetMapping
    public List<Transaccion> listarTodas() {
        return transaccionService.listarTodas();
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Transaccion> historial(@PathVariable("clienteId") Long clienteId) {
        return transaccionService.historialCliente(clienteId);
    }

    @GetMapping("/cliente/{clienteId}/saldo")
    public BigDecimal saldo(@PathVariable("clienteId") Long clienteId) {
        return transaccionService.saldoCliente(clienteId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permisoService.tieneAcceso('TRANSACCIONES_ELIMINAR')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        transaccionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
