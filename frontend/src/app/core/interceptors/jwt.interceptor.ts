import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Adjunta el JWT a cada request hacia la API y, si el backend responde
 * 401 (token vencido o inválido), cierra la sesión y redirige al login.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Los endpoints de /auth (login, forgot-password, etc.) son públicos y no
  // deben llevar un token viejo/vencido: si quedó uno en localStorage de una
  // sesión anterior, el backend lo rechaza (403) antes de validar las
  // credenciales, y el usuario ve "usuario o contraseña incorrectos" sin
  // que ese sea el problema real.
  const esEndpointPublico = req.url.includes('/auth/');

  const authReq = token && !esEndpointPublico
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
