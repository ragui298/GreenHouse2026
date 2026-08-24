package com.greenhouse.backend.cliente;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);
    List<Cliente> findByActivoTrue();
}
