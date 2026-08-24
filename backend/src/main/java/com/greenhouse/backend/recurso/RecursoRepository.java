package com.greenhouse.backend.recurso;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecursoRepository extends JpaRepository<Recurso, Long> {
    Optional<Recurso> findByClave(String clave);
    boolean existsByClave(String clave);
}
