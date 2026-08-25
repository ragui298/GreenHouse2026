package com.greenhouse.backend.usuario;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.greenhouse.backend.perfil.Perfil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "usuarios")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nombreCompleto;

    // Usado para enviar la contraseña temporal en la recuperación de acceso.
    private String email;

    private String telefono;

    private String cedula;

    // Los perfiles definen qué recursos (módulos) puede ver este usuario;
    // los accesos se suman entre todos los perfiles asignados.
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_perfil",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "perfil_id")
    )
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @Builder.Default
    private Set<Perfil> perfiles = new HashSet<>();
}
