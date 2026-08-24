package com.greenhouse.backend.producto;

import com.greenhouse.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    public List<Producto> listarActivos() {
        return productoRepository.findByActivoTrue();
    }

    public Producto crear(Producto producto) {
        return productoRepository.save(producto);
    }

    public Producto obtener(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
    }

    public Producto actualizar(Long id, Producto datos) {
        Producto producto = obtener(id);
        producto.setNombre(datos.getNombre());
        producto.setPrecio(datos.getPrecio());
        return productoRepository.save(producto);
    }

    public void desactivar(Long id) {
        Producto producto = obtener(id);
        producto.setActivo(false);
        productoRepository.save(producto);
    }
}
