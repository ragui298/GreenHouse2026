import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteService } from '../core/services/cliente.service';
import { Cliente } from '../core/models/cliente.model';

@Component({
  selector: 'app-mantenimiento-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mantenimiento-clientes.component.html',
  styleUrl: './mantenimiento-clientes.component.css'
})
export class MantenimientoClientesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);

  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly editandoId = signal<number | null>(null);
  readonly mostrarFormulario = signal(false);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required]],
    telefono: [''],
    cedula: ['']
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.clienteService.listar().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los clientes.');
        this.cargando.set(false);
      }
    });
  }

  nuevoCliente(): void {
    this.editandoId.set(null);
    this.form.reset();
    this.mostrarFormulario.set(true);
  }

  editar(cliente: Cliente): void {
    this.editandoId.set(cliente.id);
    this.form.setValue({
      nombre: cliente.nombre,
      telefono: cliente.telefono ?? '',
      cedula: cliente.cedula ?? ''
    });
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
    this.editandoId.set(null);
    this.form.reset();
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
      telefono: this.form.value.telefono || undefined,
      cedula: this.form.value.cedula || undefined
    };

    const id = this.editandoId();
    const peticion = id
      ? this.clienteService.actualizar(id, datos)
      : this.clienteService.crear(datos);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar el cliente.');
      }
    });
  }

  desactivar(cliente: Cliente): void {
    if (!confirm(`¿Desactivar a ${cliente.nombre}? Ya no aparecerá en la lista de clientes.`)) {
      return;
    }
    this.clienteService.desactivar(cliente.id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo desactivar el cliente.')
    });
  }
}
