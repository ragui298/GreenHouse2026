import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const { username, password } = this.form.getRawValue();

    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err.status === 401 || err.status === 403) {
          this.error.set('Usuario o contraseña incorrectos.');
        } else {
          this.error.set('No se pudo conectar con el servidor. Intentá de nuevo.');
        }
      }
    });
  }
}
