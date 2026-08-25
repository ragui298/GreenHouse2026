package com.greenhouse.backend.usuario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String username;
    private String nombreCompleto;
    private String telefono;
    private String cedula;
    private List<PerfilResumen> perfiles;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerfilResumen {
        private Long id;
        private String nombre;
    }
}
