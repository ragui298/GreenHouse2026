import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../core/services/usuario.service';
import { PerfilService } from '../core/services/perfil.service';
import { AuthService } from '../core/services/auth.service';
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
  private readonly authService = inject(AuthService);

  readonly puedeCrearUsuario = this.authService.tieneAcceso('USUARIOS_CREAR');

  readonly usuarios = signal<Usuario[]>([]);
  readonly perfiles = signal<Perfil[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mostrarFormulario = signal(false);
  readonly perfilesSeleccionados = signal<Set<number>>(new Set());

  readonly editandoPerfilesId = signal<number | null>(null);
  readonly perfilesEnEdicion = signal<Set<number>>(new Set());
  readonly guardandoPerfiles = signal(false);

  readonly editandoDatosId = signal<number | null>(null);
  readonly guardandoDatos = signal(false);

  readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nombreCompleto: ['', [Validators.required]]
  });

  readonly editForm = this.fb.group({
    nombreCompleto: ['', [Validators.required]],
    telefono: [''],
    cedula: [''],
    password: ['', [Validators.minLength(6)]]
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
    this.form.reset({ username: '', password: '', nombreCompleto: '' });
    this.perfilesSeleccionados.set(new Set());
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
    this.form.reset();
  }

  toggleNuevoPerfil(perfilId: number, checked: boolean): void {
    const seleccionados = new Set(this.perfilesSeleccionados());
    if (checked) {
      seleccionados.add(perfilId);
    } else {
      seleccionados.delete(perfilId);
    }
    this.perfilesSeleccionados.set(seleccionados);
  }

  guardar(): void {
    if (this.form.invalid || this.perfilesSeleccionados().size === 0) {
      this.form.markAllAsTouched();
      if (this.perfilesSeleccionados().size === 0) {
        this.error.set('Elegí al menos un perfil.');
      }
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.usuarioService.crear({
      username: this.form.value.username!,
      password: this.form.value.password!,
      nombreCompleto: this.form.value.nombreCompleto!,
      perfilIds: Array.from(this.perfilesSeleccionados())
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

  editarDatos(usuario: Usuario): void {
    this.editandoDatosId.set(usuario.id);
    this.editForm.setValue({
      nombreCompleto: usuario.nombreCompleto,
      telefono: usuario.telefono ?? '',
      cedula: usuario.cedula ?? '',
      password: ''
    });
  }

  cancelarEdicionDatos(): void {
    this.editandoDatosId.set(null);
    this.editForm.reset();
  }

  guardarDatos(usuario: Usuario): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.guardandoDatos.set(true);
    this.error.set(null);

    const { nombreCompleto, telefono, cedula, password } = this.editForm.getRawValue();

    this.usuarioService.actualizar(usuario.id, {
      nombreCompleto: nombreCompleto!,
      telefono: telefono || undefined,
      cedula: cedula || undefined,
      password: password || undefined
    }).subscribe({
      next: () => {
        this.guardandoDatos.set(false);
        this.cancelarEdicionDatos();
        this.cargar();
      },
      error: () => {
        this.guardandoDatos.set(false);
        this.error.set('No se pudieron guardar los cambios.');
      }
    });
  }

  editarPerfiles(usuario: Usuario): void {
    this.editandoPerfilesId.set(usuario.id);
    this.perfilesEnEdicion.set(new Set(usuario.perfiles.map(p => p.id)));
  }

  cancelarEdicionPerfiles(): void {
    this.editandoPerfilesId.set(null);
  }

  toggleEdicionPerfil(perfilId: number, checked: boolean): void {
    const seleccionados = new Set(this.perfilesEnEdicion());
    if (checked) {
      seleccionados.add(perfilId);
    } else {
      seleccionados.delete(perfilId);
    }
    this.perfilesEnEdicion.set(seleccionados);
  }

  guardarPerfiles(usuario: Usuario): void {
    const perfilIds = Array.from(this.perfilesEnEdicion());
    if (perfilIds.length === 0) {
      this.error.set('Un usuario necesita al menos un perfil.');
      return;
    }

    this.guardandoPerfiles.set(true);
    this.usuarioService.asignarPerfiles(usuario.id, perfilIds).subscribe({
      next: () => {
        this.guardandoPerfiles.set(false);
        this.editandoPerfilesId.set(null);
        this.cargar();
      },
      error: () => {
        this.guardandoPerfiles.set(false);
        this.error.set('No se pudieron guardar los perfiles.');
      }
    });
  }
}
