import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../core/services/usuario.service';
import { PerfilService } from '../core/services/perfil.service';
import { Usuario } from '../core/models/usuario.model';
import { Perfil } from '../core/models/perfil.model';

@Component({
  selector: 'app-mantenimiento-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mantenimiento-usuarios.component.html',
  styleUrl: './mantenimiento-usuarios.component.css'
})
export class MantenimientoUsuariosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly perfiles = signal<Perfil[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarFormulario = signal(false);

  readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombreCompleto: ['', [Validators.required]],
    perfilId: [null as number | null, [Validators.required]]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los usuarios.');
        this.cargando.set(false);
      }
    });
    this.perfilService.listar().subscribe({
      next: (perfiles) => this.perfiles.set(perfiles)
    });
  }

  nuevoUsuario(): void {
    this.form.reset({ username: '', password: '', nombreCompleto: '', perfilId: null });
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
    this.form.reset();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.usuarioService.crear({
      username: this.form.value.username!,
      password: this.form.value.password!,
      nombreCompleto: this.form.value.nombreCompleto!,
      perfilId: this.form.value.perfilId!
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        if (err.status === 409) {
          this.error.set('Ese nombre de usuario ya existe.');
        } else {
          this.error.set('No se pudo crear el usuario.');
        }
      }
    });
  }

  cambiarPerfil(usuario: Usuario, event: Event): void {
    const perfilId = Number((event.target as HTMLSelectElement).value);
    this.usuarioService.cambiarPerfil(usuario.id, perfilId).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo cambiar el perfil.')
    });
  }
}
