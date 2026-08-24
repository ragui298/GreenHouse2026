package com.greenhouse.backend.usuario.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CambiarPerfilRequest {
    @NotNull
    private Long perfilId;
}
