import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly enviado = signal(false);

  readonly form = this.fb.group({
    username: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const { username } = this.form.getRawValue();

    this.authService.forgotPassword(username!).subscribe({
      next: () => {
        this.cargando.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err.status === 503) {
          this.error.set('El servicio de correo no está disponible en este momento. Intentá más tarde.');
        } else {
          this.error.set('No se pudo conectar con el servidor. Intentá de nuevo.');
        }
      }
    });
  }
}
