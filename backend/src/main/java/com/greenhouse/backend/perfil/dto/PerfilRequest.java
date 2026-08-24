package com.greenhouse.backend.perfil.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PerfilRequest {
    @NotBlank
    private String nombre;

    private String descripcion;
}
