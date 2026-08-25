package com.greenhouse.backend.usuario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActualizarUsuarioRequest {
    @NotBlank
    private String nombreCompleto;

    private String telefono;

    private String cedula;

    // Opcional: si viene vacío o null, no se toca la contraseña actual.
    private String password;
}
