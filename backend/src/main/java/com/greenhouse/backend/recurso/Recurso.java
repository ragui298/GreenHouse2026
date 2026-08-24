package com.greenhouse.backend.recurso;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Un "recurso" representa un módulo o pantalla de la aplicación
 * (ej. Clientes, Productos, Transacciones, Reportes). Los perfiles
 * se arman asignando qué recursos puede ver cada uno.
 */
@Entity
@Table(name = "recursos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recurso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Código interno estable, usado en el código y en las validaciones
    // de permisos (ej. "CLIENTES", "PRODUCTOS"). No se traduce ni cambia.
    @NotBlank
    @Column(nullable = false, unique = true)
    private String clave;

    @NotBlank
    @Column(nullable = false)
    private String nombre;

    private String descripcion;
}
