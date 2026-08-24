package com.greenhouse.backend.recurso;

import com.greenhouse.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecursoService {

    private final RecursoRepository recursoRepository;

    public List<Recurso> listar() {
        return recursoRepository.findAll();
    }

    public Recurso obtener(Long id) {
        return recursoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurso no encontrado: " + id));
    }

    public Recurso crear(Recurso recurso) {
        if (recursoRepository.existsByClave(recurso.getClave())) {
            throw new IllegalArgumentException("Ya existe un recurso con la clave: " + recurso.getClave());
        }
        return recursoRepository.save(recurso);
    }

    public Recurso actualizar(Long id, Recurso datos) {
        Recurso recurso = obtener(id);
        recurso.setNombre(datos.getNombre());
        recurso.setDescripcion(datos.getDescripcion());
        // La clave no se edita: es el identificador estable usado en el código.
        return recursoRepository.save(recurso);
    }
}
