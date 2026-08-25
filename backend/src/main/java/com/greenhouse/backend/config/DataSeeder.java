package com.greenhouse.backend.config;

import com.greenhouse.backend.perfil.Perfil;
import com.greenhouse.backend.perfil.PerfilRepository;
import com.greenhouse.backend.recurso.Recurso;
import com.greenhouse.backend.recurso.RecursoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    private record RecursoBase(String clave, String nombre, String descripcion) {}

    private static final List<RecursoBase> RECURSOS_BASE = List.of(
            new RecursoBase("DASHBOARD", "Dashboard", "Ver el panel principal"),
            new RecursoBase("CLIENTES", "Clientes", "Ver clientes y su saldo"),
            new RecursoBase("MANTENIMIENTO_CLIENTES", "Mantenimiento de clientes", "Crear, editar y desactivar clientes"),
            new RecursoBase("PRODUCTOS", "Mantenimiento de productos", "Ver y administrar el catálogo de productos"),
            new RecursoBase("TRANSACCIONES", "Transacciones", "Registrar cargos (fiado) y abonos (pagos)"),
            new RecursoBase("TRANSACCIONES_ELIMINAR", "Eliminar transacciones", "Botón para eliminar una transacción registrada"),
            new RecursoBase("REPORTES", "Reportes", "Ver totales adeudados y reportes generales"),
            new RecursoBase("USUARIOS", "Mantenimiento de usuarios", "Ver y administrar usuarios"),
            new RecursoBase("USUARIOS_CREAR", "Crear usuario", "Botón para dar de alta un usuario nuevo"),
            new RecursoBase("MANTENIMIENTO_PERFILES", "Mantenimiento de perfiles", "Administrar perfiles y qué recursos ve cada uno")
    );

    @Override
    public void run(String... args) {
        migrarUsuarioPerfilLegacy();

        // Agrega los recursos del catálogo que todavía no existan, sin tocar
        // los que ya están (permite ampliar RECURSOS_BASE en versiones
        // futuras sin perder los perfiles/asignaciones ya configurados).
        List<Recurso> nuevos = RECURSOS_BASE.stream()
                .filter(r -> !recursoRepository.existsByClave(r.clave()))
                .map(r -> recursoRepository.save(
                        Recurso.builder()
                                .clave(r.clave())
                                .nombre(r.nombre())
                                .descripcion(r.descripcion())
                                .build()
                ))
                .toList();

        if (perfilRepository.count() == 0) {
            Set<Recurso> todos = new HashSet<>(recursoRepository.findAll());
            perfilRepository.save(
                    Perfil.builder()
                            .nombre("ADMIN")
                            .descripcion("Acceso completo a todos los recursos del sistema")
                            .recursos(todos)
                            .build()
            );
        } else if (!nuevos.isEmpty()) {
            // El perfil ADMIN ya existía: le suma los recursos nuevos para que
            // no pierda acceso a pantallas agregadas después de su creación.
            perfilRepository.findByNombre("ADMIN").ifPresent(admin -> {
                admin.getRecursos().addAll(nuevos);
                perfilRepository.save(admin);
            });
        }
    }

    // Antes cada usuario tenía un único perfil (columna usuarios.perfil_id).
    // Ahora es muchos a muchos (tabla usuario_perfil). Copia las asignaciones
    // viejas a la tabla nueva y libera la columna vieja para que no bloquee
    // altas de usuarios nuevos. Es seguro correrlo en cada arranque: no hace
    // nada si la columna ya no existe o si los datos ya se migraron.
    private void migrarUsuarioPerfilLegacy() {
        Boolean columnaExiste = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.columns " +
                        "WHERE table_name = 'usuarios' AND column_name = 'perfil_id')",
                Boolean.class
        );
        if (columnaExiste == null || !columnaExiste) {
            return;
        }

        jdbcTemplate.update(
                "INSERT INTO usuario_perfil (usuario_id, perfil_id) " +
                        "SELECT u.id, u.perfil_id FROM usuarios u " +
                        "WHERE u.perfil_id IS NOT NULL " +
                        "AND NOT EXISTS (SELECT 1 FROM usuario_perfil up WHERE up.usuario_id = u.id)"
        );
        jdbcTemplate.execute("ALTER TABLE usuarios ALTER COLUMN perfil_id DROP NOT NULL");
    }
}
