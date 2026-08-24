package com.greenhouse.backend.auth;

import com.greenhouse.backend.auth.dto.LoginRequest;
import com.greenhouse.backend.auth.dto.LoginResponse;
import com.greenhouse.backend.auth.dto.RegisterRequest;
import com.greenhouse.backend.config.JwtUtil;
import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.perfil.Perfil;
import com.greenhouse.backend.perfil.PerfilRepository;
import com.greenhouse.backend.recurso.Recurso;
import com.greenhouse.backend.usuario.Usuario;
import com.greenhouse.backend.usuario.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Registro solo pensado para crear al primer dueño/admin.
    // En producción, protegé o eliminá este endpoint tras crear el usuario inicial.
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("El usuario ya existe");
        }

        Perfil perfil = (request.getPerfilId() != null)
                ? perfilRepository.findById(request.getPerfilId())
                        .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado: " + request.getPerfilId()))
                : perfilRepository.findByNombre("ADMIN")
                        .orElseThrow(() -> new IllegalStateException(
                                "No existe el perfil ADMIN por defecto. Revisá que DataSeeder haya corrido."));

        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nombreCompleto(request.getNombreCompleto())
                .perfil(perfil)
                .build();

        usuarioRepository.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body("Usuario creado correctamente");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByUsername(request.getUsername()).orElseThrow();

        UserDetails userDetails = org.springframework.security.core.userdetails.User
                .withUsername(request.getUsername())
                .password("")
                .authorities("ROLE_" + usuario.getPerfil().getNombre())
                .build();

        String token = jwtUtil.generateToken(userDetails);
        List<String> claves = usuario.getPerfil().getRecursos().stream()
                .map(Recurso::getClave)
                .toList();

        return ResponseEntity.ok(new LoginResponse(
                token,
                usuario.getUsername(),
                usuario.getNombreCompleto(),
                usuario.getPerfil().getNombre(),
                claves
        ));
    }
}
