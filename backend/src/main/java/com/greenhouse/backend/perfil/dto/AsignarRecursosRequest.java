package com.greenhouse.backend.perfil.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AsignarRecursosRequest {
    @NotNull
    private List<Long> recursoIds;
}
