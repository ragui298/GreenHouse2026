package com.greenhouse.backend.usuario;

import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.perfil.Perfil;
import com.greenhouse.backend.perfil.PerfilRepository;
import com.greenhouse.backend.usuario.dto.CambiarPerfilRequest;
import com.greenhouse.backend.usuario.dto.UsuarioDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Administrar usuarios (verlos, cambiarles el perfil) requiere el recurso
// "USUARIOS". Crear un usuario nuevo sigue siendo /api/auth/register.
@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@PreAuthorize("@permisoService.tieneAcceso('USUARIOS')")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;

    @GetMapping
    public List<UsuarioDTO> listar() {
        return usuarioRepository.findAll().stream().map(this::toDTO).toList();
    }

    @GetMapping("/{id}")
    public UsuarioDTO obtener(@PathVariable Long id) {
        return toDTO(obtenerEntidad(id));
    }

    @PutMapping("/{id}/perfil")
    public UsuarioDTO cambiarPerfil(@PathVariable Long id, @Valid @RequestBody CambiarPerfilRequest request) {
        Usuario usuario = obtenerEntidad(id);
        Perfil perfil = perfilRepository.findById(request.getPerfilId())
                .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado: " + request.getPerfilId()));
        usuario.setPerfil(perfil);
        return toDTO(usuarioRepository.save(usuario));
    }

    private Usuario obtenerEntidad(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
    }

    private UsuarioDTO toDTO(Usuario usuario) {
        return UsuarioDTO.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .perfilId(usuario.getPerfil().getId())
                .perfilNombre(usuario.getPerfil().getNombre())
                .build();
    }
}
