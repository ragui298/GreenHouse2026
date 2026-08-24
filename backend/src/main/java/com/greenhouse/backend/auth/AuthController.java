package com.greenhouse.backend.auth;

import com.greenhouse.backend.auth.dto.ForgotPasswordRequest;
import com.greenhouse.backend.auth.dto.LoginRequest;
import com.greenhouse.backend.auth.dto.LoginResponse;
import com.greenhouse.backend.auth.dto.RegisterRequest;
import com.greenhouse.backend.config.EmailService;
import com.greenhouse.backend.config.JwtUtil;
import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.perfil.Perfil;
import com.greenhouse.backend.perfil.PerfilRepository;
import com.greenhouse.backend.recurso.Recurso;
import com.greenhouse.backend.usuario.Usuario;
import com.greenhouse.backend.usuario.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final String CARACTERES_PASSWORD_TEMPORAL = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(request.getUsername());

        if (usuarioOpt.isPresent() && usuarioOpt.get().getEmail() != null && !usuarioOpt.get().getEmail().isBlank()) {
            Usuario usuario = usuarioOpt.get();
            String passwordTemporal = generarPasswordTemporal();
            usuario.setPassword(passwordEncoder.encode(passwordTemporal));
            usuarioRepository.save(usuario);

            String cuerpo = "<p>Hola " + usuario.getNombreCompleto() + ",</p>"
                    + "<p>Tu nueva contraseña temporal para Green House es:</p>"
                    + "<p style=\"font-size:20px;font-weight:bold;letter-spacing:1px;\">" + passwordTemporal + "</p>"
                    + "<p>Por seguridad, cambiala apenas ingreses.</p>";

            try {
                emailService.enviarCorreo(usuario.getEmail(), "Recuperación de contraseña - Green House", cuerpo);
            } catch (Exception e) {
                log.error("No se pudo enviar el correo de recuperación para el usuario {}", usuario.getUsername(), e);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("No se pudo enviar el correo en este momento. Intentá más tarde.");
            }
        }

        // Respuesta genérica siempre, exista o no el usuario/email, para no
        // revelar qué usuarios existen en el sistema.
        return ResponseEntity.ok("Si el usuario existe y tiene un correo registrado, se envió una contraseña nueva.");
    }

    private String generarPasswordTemporal() {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(CARACTERES_PASSWORD_TEMPORAL.charAt(random.nextInt(CARACTERES_PASSWORD_TEMPORAL.length())));
        }
        return sb.toString();
    }
}
