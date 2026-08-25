import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PerfilService } from '../core/services/perfil.service';
import { Perfil, Recurso } from '../core/models/perfil.model';

@Component({
  selector: 'app-mantenimiento-perfiles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mantenimiento-perfiles.component.html',
  styleUrl: './mantenimiento-perfiles.component.css'
})
export class MantenimientoPerfilesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly perfilService = inject(PerfilService);

  readonly perfiles = signal<Perfil[]>([]);
  readonly recursos = signal<Recurso[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarFormulario = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly recursosSeleccionados = signal<Set<number>>(new Set());

  readonly form = this.fb.group({
    nombre: ['', [Validators.required]],
    descripcion: ['']
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.perfilService.listar().subscribe({
      next: (perfiles) => {
        this.perfiles.set(perfiles);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los perfiles.');
        this.cargando.set(false);
      }
    });
    this.perfilService.listarRecursos().subscribe({
      next: (recursos) => this.recursos.set(recursos)
    });
  }

  nuevoPerfil(): void {
    this.editandoId.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
    this.recursosSeleccionados.set(new Set());
    this.mostrarFormulario.set(true);
  }

  editar(perfil: Perfil): void {
    this.editandoId.set(perfil.id);
    this.form.setValue({
      nombre: perfil.nombre,
      descripcion: perfil.descripcion ?? ''
    });
    this.recursosSeleccionados.set(new Set(perfil.recursos.map(r => r.id)));
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
    this.editandoId.set(null);
    this.form.reset();
  }

  toggleRecurso(recursoId: number, checked: boolean): void {
    const seleccionados = new Set(this.recursosSeleccionados());
    if (checked) {
      seleccionados.add(recursoId);
    } else {
      seleccionados.delete(recursoId);
    }
    this.recursosSeleccionados.set(seleccionados);
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
      descripcion: this.form.value.descripcion || undefined
    };

    const id = this.editandoId();
    const peticion = id ? this.perfilService.actualizar(id, datos) : this.perfilService.crear(datos);

    peticion.subscribe({
      next: (perfil) => {
        const recursoIds = Array.from(this.recursosSeleccionados());
        this.perfilService.asignarRecursos(perfil.id, recursoIds).subscribe({
          next: () => {
            this.guardando.set(false);
            this.cancelar();
            this.cargar();
          },
          error: () => {
            this.guardando.set(false);
            this.error.set('El perfil se guardó, pero no se pudieron asignar los recursos.');
          }
        });
      },
      error: (err) => {
        this.guardando.set(false);
        if (err.status === 409 || err.status === 400) {
          this.error.set('Ya existe un perfil con ese nombre.');
        } else {
          this.error.set('No se pudo guardar el perfil.');
        }
      }
    });
  }
}
