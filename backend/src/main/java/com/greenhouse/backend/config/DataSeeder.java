package com.greenhouse.backend.config;

import com.greenhouse.backend.perfil.Perfil;
import com.greenhouse.backend.perfil.PerfilRepository;
import com.greenhouse.backend.recurso.Recurso;
import com.greenhouse.backend.recurso.RecursoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Crea, al arrancar la app por primera vez, el catálogo básico de recursos
 * y un perfil "ADMIN" con acceso a todos ellos. Así el endpoint
 * /api/auth/register siempre tiene un perfil por defecto disponible.
 * No hace nada si ya existen datos (es seguro correrlo en cada arranque).
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RecursoRepository recursoRepository;
    private final PerfilRepository perfilRepository;

    private record RecursoBase(String clave, String nombre, String descripcion) {}

    private static final List<RecursoBase> RECURSOS_BASE = List.of(
            new RecursoBase("CLIENTES", "Clientes", "Ver y administrar clientes y su saldo"),
            new RecursoBase("PRODUCTOS", "Productos", "Ver y administrar el catálogo de productos"),
            new RecursoBase("TRANSACCIONES", "Transacciones", "Registrar cargos (fiado) y abonos (pagos)"),
            new RecursoBase("REPORTES", "Reportes", "Ver totales adeudados y reportes generales"),
            new RecursoBase("USUARIOS", "Usuarios y perfiles", "Administrar usuarios, perfiles y permisos")
    );

    @Override
    public void run(String... args) {
        if (recursoRepository.count() == 0) {
            RECURSOS_BASE.forEach(r -> recursoRepository.save(
                    Recurso.builder()
                            .clave(r.clave())
                            .nombre(r.nombre())
                            .descripcion(r.descripcion())
                            .build()
            ));
        }

        if (perfilRepository.count() == 0) {
            Set<Recurso> todos = new HashSet<>(recursoRepository.findAll());
            perfilRepository.save(
                    Perfil.builder()
                            .nombre("ADMIN")
                            .descripcion("Acceso completo a todos los recursos del sistema")
                            .recursos(todos)
                            .build()
            );
        }
    }
}
