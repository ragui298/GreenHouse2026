# Green House — Frontend (Angular)

> Ubicación sugerida del proyecto: `C:\DEV\GreenHouse\frontend`

App Angular standalone (**v21**) para el control de fiado. Login con JWT y pantalla
principal con el listado de clientes y su saldo.

## Requisitos
- **Node.js**: `^20.19.0 || ^22.12.0 || ^24.0.0` (Angular 21 no arranca con versiones más viejas)
- Angular CLI: `npm install -g @angular/cli@21`

## Configuración en VS Code

Instalá la extensión **Angular Language Service** (Angular) para autocompletado en
templates y detección de errores.

## Instalación

```bash
npm install
```

## Configurar la URL del backend

- **Desarrollo**: `src/environments/environment.ts` → ya apunta a `http://localhost:8080/api`
  (tu backend Spring Boot corriendo local).
- **Producción**: `src/environments/environment.prod.ts` → reemplazá `apiUrl` por la URL real
  de tu backend publicado (ej. Render).

## Correr en desarrollo

```bash
npm start
```
Abre en `http://localhost:4200`. Asegurate de que el backend esté corriendo en `:8080`
(o vas a ver errores de conexión al intentar loguearte).

## Build para producción

```bash
npm run build:prod
```
Genera los archivos estáticos en `dist/greenhouse-frontend/browser/` — esa carpeta es
la que subís a Netlify/Vercel.

## Estructura

```
src/app/
├── core/
│   ├── guards/auth.guard.ts       — protege /dashboard si no hay sesión
│   ├── interceptors/jwt.interceptor.ts  — adjunta el token a cada request
│   ├── services/                  — AuthService, ClienteService, TransaccionService
│   └── models/                    — interfaces que reflejan los DTOs del backend
├── login/                         — pantalla de login
├── dashboard/                     — pantalla principal (listado de clientes + saldo)
├── app.config.ts                  — bootstrap standalone, registra el interceptor
└── app.routes.ts                  — rutas y lazy loading
```

## Cómo funciona la autenticación

1. `LoginComponent` llama a `AuthService.login()`, que hace `POST /api/auth/login`.
2. El backend devuelve un JWT; se guarda en `localStorage`.
3. `jwtInterceptor` agrega automáticamente `Authorization: Bearer <token>` a cada
   request hacia la API.
4. `authGuard` protege la ruta `/dashboard`: si no hay token, redirige a `/login`.
5. Si el backend responde `401` (token vencido), el interceptor cierra la sesión
   automáticamente y redirige al login.

## Primer usuario

Si todavía no creaste el usuario dueño en el backend, hacelo antes de intentar loguearte
(ver el README del backend, sección "Crear el primer usuario").

## Próximos pasos sugeridos
- Pantalla de detalle de cliente con historial de transacciones
- Formulario para registrar cargos (fiado) y abonos (pagos)
- CRUD de productos
