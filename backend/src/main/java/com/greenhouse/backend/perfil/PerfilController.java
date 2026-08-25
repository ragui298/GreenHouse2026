package com.greenhouse.backend.perfil;

import com.greenhouse.backend.perfil.dto.AsignarRecursosRequest;
import com.greenhouse.backend.perfil.dto.PerfilRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Administrar perfiles y qué recursos ve cada uno requiere el recurso
// "USUARIOS" -- es la parte de gestión de accesos de la aplicación.
@RestController
@RequestMapping("/api/perfiles")
@RequiredArgsConstructor
@PreAuthorize("@permisoService.tieneAcceso('USUARIOS')")
public class PerfilController {

    private final PerfilService perfilService;

    @GetMapping
    public List<Perfil> listar() {
        return perfilService.listar();
    }

    @GetMapping("/{id}")
    public Perfil obtener(@PathVariable("id") Long id) {
        return perfilService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<Perfil> crear(@Valid @RequestBody PerfilRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(perfilService.crear(request));
    }

    @PutMapping("/{id}")
    public Perfil actualizar(@PathVariable("id") Long id, @Valid @RequestBody PerfilRequest request) {
        return perfilService.actualizar(id, request);
    }

    // Reemplaza por completo el conjunto de recursos visibles para este perfil.
    @PutMapping("/{id}/recursos")
    public Perfil asignarRecursos(@PathVariable("id") Long id, @Valid @RequestBody AsignarRecursosRequest request) {
        return perfilService.asignarRecursos(id, request);
    }
}
