import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Sin un límite, si el backend se queda "colgado" (ej. una conexión vieja
// contra la base que nunca responde en vez de fallar) la pantalla se queda
// pegada en "Guardando..." para siempre, porque el navegador simplemente
// sigue esperando. 45s da margen de sobra para el arranque en frío de
// Render (hasta ~60s la primera vez que despierta) sin dejar que un
// cuelgue real deje a alguien esperando indefinidamente.
const TIMEOUT_MS = 45000;

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
    timeout(TIMEOUT_MS),
    catchError((error) => {
      if (error instanceof TimeoutError) {
        // Se arma como un error "sin conexión" (status 0) para que las
        // pantallas que ya manejan errores de red lo muestren igual, sin
        // tener que enseñarles un caso nuevo.
        return throwError(() => ({ status: 0, timeoutError: true }));
      }
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
