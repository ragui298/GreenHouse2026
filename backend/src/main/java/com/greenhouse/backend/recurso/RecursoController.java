package com.greenhouse.backend.recurso;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Gestionar el catálogo de recursos es en sí mismo una operación de
// administración de accesos, por eso requiere el recurso "USUARIOS".
@RestController
@RequestMapping("/api/recursos")
@RequiredArgsConstructor
@PreAuthorize("@permisoService.tieneAcceso('USUARIOS')")
public class RecursoController {

    private final RecursoService recursoService;

    @GetMapping
    public List<Recurso> listar() {
        return recursoService.listar();
    }

    @GetMapping("/{id}")
    public Recurso obtener(@PathVariable Long id) {
        return recursoService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<Recurso> crear(@Valid @RequestBody Recurso recurso) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recursoService.crear(recurso));
    }

    @PutMapping("/{id}")
    public Recurso actualizar(@PathVariable Long id, @Valid @RequestBody Recurso recurso) {
        return recursoService.actualizar(id, recurso);
    }
}
