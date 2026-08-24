package com.greenhouse.backend.perfil;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.greenhouse.backend.recurso.Recurso;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

/**
 * Un perfil (rol) agrupa un conjunto de recursos visibles.
 * Ej.: el perfil "CAJERO" puede tener acceso solo a CLIENTES y
 * TRANSACCIONES, mientras que "ADMIN" tiene todos los recursos.
 */
@Entity
@Table(name = "perfiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Perfil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String nombre;

    private String descripcion;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "perfil_recurso",
            joinColumns = @JoinColumn(name = "perfil_id"),
            inverseJoinColumns = @JoinColumn(name = "recurso_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @Builder.Default
    private Set<Recurso> recursos = new HashSet<>();
}
