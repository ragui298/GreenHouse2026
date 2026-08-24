package com.greenhouse.backend.config;

import com.greenhouse.backend.usuario.Usuario;
import com.greenhouse.backend.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bean expuesto como "permisoService" para usar en anotaciones @PreAuthorize,
 * ej: @PreAuthorize("@permisoService.tieneAcceso('CLIENTES')").
 * Verifica si el perfil del usuario autenticado tiene asignado el recurso
 * indicado por su clave.
 */
@Service("permisoService")
@RequiredArgsConstructor
public class PermisoService {

    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public boolean tieneAcceso(String claveRecurso) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        return usuarioRepository.findByUsername(auth.getName())
                .map(Usuario::getPerfil)
                .map(perfil -> perfil.getRecursos().stream()
                        .anyMatch(recurso -> recurso.getClave().equalsIgnoreCase(claveRecurso)))
                .orElse(false);
    }
}
