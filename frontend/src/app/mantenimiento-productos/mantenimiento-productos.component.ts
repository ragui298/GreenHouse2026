import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../core/services/producto.service';
import { Producto } from '../core/models/producto.model';

@Component({
  selector: 'app-mantenimiento-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mantenimiento-productos.component.html',
  styleUrl: './mantenimiento-productos.component.css'
})
export class MantenimientoProductosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly editandoId = signal<number | null>(null);
  readonly mostrarFormulario = signal(false);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required]],
    precio: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.productoService.listar().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
        this.cargando.set(false);
      }
    });
  }

  nuevoProducto(): void {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', precio: 0 });
    this.mostrarFormulario.set(true);
  }

  editar(producto: Producto): void {
    this.editandoId.set(producto.id);
    this.form.setValue({ nombre: producto.nombre, precio: producto.precio });
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
    this.editandoId.set(null);
    this.form.reset({ nombre: '', precio: 0 });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const datos = {
      nombre: this.form.value.nombre!,
      precio: this.form.value.precio!
    };

    const id = this.editandoId();
    const peticion = id
      ? this.productoService.actualizar(id, datos)
      : this.productoService.crear(datos);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar el producto.');
      }
    });
  }

  desactivar(producto: Producto): void {
    if (!confirm(`¿Desactivar "${producto.nombre}"? Ya no aparecerá en el catálogo.`)) {
      return;
    }
    this.productoService.desactivar(producto.id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo desactivar el producto.')
    });
  }

  formatoColones(monto: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0
    }).format(monto);
  }
}
