package com.greenhouse.backend.usuario.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AsignarPerfilesRequest {
    @NotEmpty
    private List<Long> perfilIds;
}
