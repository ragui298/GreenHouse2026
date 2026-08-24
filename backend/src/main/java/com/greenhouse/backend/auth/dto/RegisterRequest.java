package com.greenhouse.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String nombreCompleto;

    // Usado para recuperación de contraseña. Opcional.
    private String email;

    // Opcional: si no se indica, se asigna el perfil "ADMIN" (creado
    // automáticamente al arrancar la app con acceso a todos los recursos).
    private Long perfilId;
}
