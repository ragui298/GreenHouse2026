package com.greenhouse.backend.transaccion;

import com.greenhouse.backend.transaccion.dto.ReporteSemanalResponse;
import com.greenhouse.backend.transaccion.dto.TransaccionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transacciones")
@RequiredArgsConstructor
@PreAuthorize("@permisoService.tieneAcceso('TRANSACCIONES')")
public class TransaccionController {

    private final TransaccionService transaccionService;
    private final ExportacionService exportacionService;

    @PostMapping
    public ResponseEntity<Transaccion> registrar(@Valid @RequestBody TransaccionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionService.registrar(request));
    }

    @GetMapping
    public List<Transaccion> listarTodas() {
        return transaccionService.listarTodas();
    }

    @GetMapping("/reporte")
    @PreAuthorize("@permisoService.tieneAcceso('REPORTES')")
    public ReporteSemanalResponse reporte(
            @RequestParam(value = "desde", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(value = "hasta", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return transaccionService.reporteSemanal(desde, hasta);
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Transaccion> historial(@PathVariable("clienteId") Long clienteId) {
        return transaccionService.historialCliente(clienteId);
    }

    @GetMapping("/cliente/{clienteId}/saldo")
    public BigDecimal saldo(@PathVariable("clienteId") Long clienteId) {
        return transaccionService.saldoCliente(clienteId);
    }

    @GetMapping("/exportar")
    @PreAuthorize("@permisoService.tieneAcceso('EXPORTAR')")
    public ResponseEntity<byte[]> exportar(
            @RequestParam("desde") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam("hasta") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        byte[] archivo = exportacionService.exportarTransacciones(desde.atStartOfDay(), hasta.atTime(23, 59, 59));
        String nombreArchivo = "transacciones_" + desde + "_a_" + hasta + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"")
                .body(archivo);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permisoService.tieneAcceso('TRANSACCIONES_ELIMINAR')")
    public ResponseEntity<Void> eliminar(@PathVariable("id") Long id) {
        transaccionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
