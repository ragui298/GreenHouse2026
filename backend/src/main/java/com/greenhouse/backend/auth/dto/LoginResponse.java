package com.greenhouse.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String nombreCompleto;
    private String perfil;
    // Claves de los recursos que el perfil de este usuario puede ver
    // (ej. ["CLIENTES", "TRANSACCIONES"]). El frontend usa esto para
    // decidir qué mostrar en el menú.
    private List<String> recursos;
}
