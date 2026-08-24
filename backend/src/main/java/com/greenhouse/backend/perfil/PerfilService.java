package com.greenhouse.backend.perfil;

import com.greenhouse.backend.exception.ResourceNotFoundException;
import com.greenhouse.backend.perfil.dto.AsignarRecursosRequest;
import com.greenhouse.backend.perfil.dto.PerfilRequest;
import com.greenhouse.backend.recurso.Recurso;
import com.greenhouse.backend.recurso.RecursoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final PerfilRepository perfilRepository;
    private final RecursoRepository recursoRepository;

    public List<Perfil> listar() {
        return perfilRepository.findAll();
    }

    public Perfil obtener(Long id) {
        return perfilRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil no encontrado: " + id));
    }

    public Perfil crear(PerfilRequest request) {
        if (perfilRepository.existsByNombre(request.getNombre())) {
            throw new IllegalArgumentException("Ya existe un perfil con el nombre: " + request.getNombre());
        }
        Perfil perfil = Perfil.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .build();
        return perfilRepository.save(perfil);
    }

    public Perfil actualizar(Long id, PerfilRequest request) {
        Perfil perfil = obtener(id);
        perfil.setNombre(request.getNombre());
        perfil.setDescripcion(request.getDescripcion());
        return perfilRepository.save(perfil);
    }

    @Transactional
    public Perfil asignarRecursos(Long id, AsignarRecursosRequest request) {
        Perfil perfil = obtener(id);
        Set<Recurso> recursos = new HashSet<>(recursoRepository.findAllById(request.getRecursoIds()));

        if (recursos.size() != request.getRecursoIds().size()) {
            throw new IllegalArgumentException("Uno o más recursos indicados no existen");
        }

        perfil.setRecursos(recursos);
        return perfilRepository.save(perfil);
    }
}
