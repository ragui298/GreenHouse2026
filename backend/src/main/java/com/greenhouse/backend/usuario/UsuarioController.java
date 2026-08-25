package com.greenhouse.backend.usuario;

import com.greenhouse.backend.auth.dto.RegisterRequest;
import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.perfil.Perfil;
import com.greenhouse.backend.perfil.PerfilRepository;
import com.greenhouse.backend.usuario.dto.ActualizarUsuarioRequest;
import com.greenhouse.backend.usuario.dto.AsignarPerfilesRequest;
import com.greenhouse.backend.usuario.dto.UsuarioDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

// Administrar usuarios (verlos, cambiarles los perfiles, crearlos) requiere
// el recurso "USUARIOS"; crear específicamente requiere además
// "USUARIOS_CREAR". /api/auth/register queda solo para crear el primer admin
// en una instalación nueva (ver AuthController).
@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@PreAuthorize("@permisoService.tieneAcceso('USUARIOS')")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<UsuarioDTO> listar() {
        return usuarioRepository.findAll().stream().map(this::toDTO).toList();
    }

    @PostMapping
    @PreAuthorize("@permisoService.tieneAcceso('USUARIOS_CREAR')")
    public ResponseEntity<?> crear(@Valid @RequestBody RegisterRequest request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("El usuario ya existe");
        }

        Set<Perfil> perfiles = resolverPerfiles(request.getPerfilIds());

        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nombreCompleto(request.getNombreCompleto())
                .email(request.getEmail())
                .perfiles(perfiles)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(usuarioRepository.save(usuario)));
    }

    @GetMapping("/{id}")
    public UsuarioDTO obtener(@PathVariable("id") Long id) {
        return toDTO(obtenerEntidad(id));
    }

    @PutMapping("/{id}")
    public UsuarioDTO actualizar(@PathVariable("id") Long id, @Valid @RequestBody ActualizarUsuarioRequest request) {
        Usuario usuario = obtenerEntidad(id);
        usuario.setNombreCompleto(request.getNombreCompleto());
        usuario.setTelefono(request.getTelefono());
        usuario.setCedula(request.getCedula());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres.");
            }
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return toDTO(usuarioRepository.save(usuario));
    }

    @PutMapping("/{id}/perfiles")
    public UsuarioDTO asignarPerfiles(@PathVariable("id") Long id, @Valid @RequestBody AsignarPerfilesRequest request) {
        Usuario usuario = obtenerEntidad(id);
        Set<Perfil> perfiles = new HashSet<>(perfilRepository.findAllById(request.getPerfilIds()));

        if (perfiles.size() != request.getPerfilIds().size()) {
            throw new IllegalArgumentException("Uno o más perfiles indicados no existen");
        }

        usuario.setPerfiles(perfiles);
        return toDTO(usuarioRepository.save(usuario));
    }

    private Set<Perfil> resolverPerfiles(List<Long> perfilIds) {
        if (perfilIds == null || perfilIds.isEmpty()) {
            return Set.of(perfilRepository.findByNombre("ADMIN")
                    .orElseThrow(() -> new IllegalStateException("No existe el perfil ADMIN por defecto.")));
        }
        return new HashSet<>(perfilRepository.findAllById(perfilIds));
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
                .telefono(usuario.getTelefono())
                .cedula(usuario.getCedula())
                .perfiles(usuario.getPerfiles().stream()
                        .map(perfil -> UsuarioDTO.PerfilResumen.builder()
                                .id(perfil.getId())
                                .nombre(perfil.getNombre())
                                .build())
                        .toList())
                .build();
    }
}
