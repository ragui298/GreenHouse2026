# Green House — Backend (Control de Fiado)

> Ubicación del proyecto: `C:\DEV\GreenHouse\backend`

API REST en **Spring Boot 4.0.7** para registrar clientes que deben dinero (fiado) en Green House,
con autenticación JWT para el dueño del negocio.

## Requisitos
- Java 17+
- Gradle 8.14+ o 9.x (Spring Boot 4.0.7 requiere como mínimo 8.14)
- PostgreSQL 14+

## Configuración en VS Code

1. Instalá estas extensiones (buscalas en el panel de Extensiones):
   - **Extension Pack for Java** (Microsoft) — soporte base de Java
   - **Gradle for Java** (Microsoft) — integra Gradle en el explorador y permite correr tareas
     con clic derecho
   - **Spring Boot Extension Pack** (VMware/Microsoft) — opcional pero útil: dashboard de Spring
     Boot, autocompletado de `application.properties`, correr/debuggear la app con un botón

2. Abrí la carpeta `backend` en VS Code (`File > Open Folder`). Al detectar `build.gradle`,
   la extensión de Java empieza a indexar el proyecto — esperá a que termine (barra de progreso
   abajo a la derecha).

## Gradle Wrapper (recomendado)

Este proyecto no trae el wrapper generado (`gradlew`, `gradlew.bat`, `gradle-wrapper.jar`), así
que necesitás tener Gradle instalado una única vez para generarlo:

- **Windows**: instalalo con `choco install gradle` (Chocolatey) o descargalo de
  https://gradle.org/install/ y agregalo al PATH.
- Luego, desde la terminal integrada de VS Code (`` Ctrl+` ``), parado en `C:\DEV\GreenHouse\backend`:
  ```bash
  gradle wrapper --gradle-version 8.14
  ```
  Esto crea `gradlew.bat`, `gradlew` y la carpeta `gradle/wrapper/`. De ahí en adelante usá
  `.\gradlew.bat` (Windows) en vez de `gradle` directamente, así no dependés de tener Gradle
  instalado globalmente y todo el equipo usa la misma versión.

Alternativa sin instalar Gradle: la extensión **Gradle for Java** puede descargar y manejar
una versión de Gradle por vos la primera vez que abrís el proyecto — si preferís esa ruta,
simplemente abrí la carpeta y dejá que la extensión indexe; te va a pedir confirmación.

## Base de datos: local o en Neon (online)

Las credenciales **no están hardcodeadas** — se leen de variables de entorno, con un default
que apunta a Postgres local para que funcione sin configurar nada si ya tenés Postgres
instalado en tu máquina.

### Opción A: Postgres local
```sql
CREATE DATABASE greenhouse_db;
```
No necesitás definir ninguna variable de entorno; usa `localhost:5432` con usuario/password
`postgres/postgres` por defecto (ajustalos en `application.properties` si los tuyos son distintos).

### Opción B: Neon (recomendado, online y gratis)

1. Creá una cuenta en https://neon.tech (sin tarjeta).
2. Creá un proyecto → base de datos `greenhouse_db`.
3. Copiá el connection string que te da Neon (sección **Connection Details**).
4. Definí estas variables de entorno antes de correr la app:

   **En la terminal de VS Code (PowerShell), por sesión:**
   ```powershell
   $env:DB_URL="jdbc:postgresql://ep-xxxx.us-east-2.aws.neon.tech/greenhouse_db?sslmode=require"
   $env:DB_USERNAME="tu_usuario_neon"
   $env:DB_PASSWORD="tu_password_neon"
   $env:JWT_SECRET="un_secreto_propio_de_al_menos_32_caracteres"
   ```
   Después, en la misma terminal: `.\gradlew.bat bootRun`

   **De forma permanente en Windows** (para no repetirlo cada vez):
   Panel de Control → Sistema → Configuración avanzada → Variables de entorno → agregá
   `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` y `JWT_SECRET` ahí. Reiniciá VS Code después.

   Guiate con el archivo `.env.example` incluido — mostrá qué variables existen (no subas
   nunca un `.env` real con tus credenciales; ya está en `.gitignore`).

**Importante**: el free tier de Neon se "duerme" tras un rato sin uso. La primera consulta
después de inactividad tarda unos segundos extra en responder — es normal, no es un error.

4. Ejecutar, con cualquiera de estas opciones:
   - **Terminal integrada**:
     ```bash
     gradle bootRun
     # o, una vez generado el wrapper:
     .\gradlew.bat bootRun
     ```
   - **Panel Gradle** (ícono de elefante en la barra lateral, viene con la extensión Gradle for
     Java): `greenhouse-backend > Tasks > application > bootRun`, doble clic.
   - **Spring Boot Dashboard** (si instalaste el extension pack): aparece un panel con el
     proyecto listado y un botón de play ▶️.

   Al iniciar, Hibernate crea las tablas automáticamente (`ddl-auto=update`).

## Otros comandos útiles

```bash
gradle build          # compilar y generar el .jar (queda en build/libs/)
gradle test           # correr tests
gradle clean          # limpiar el build
```

## Crear el primer usuario (dueño)

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"unaClaveSegura","nombreCompleto":"Doña María"}'
```

> Después de crear el primer usuario, considerá restringir o eliminar el endpoint `/register`.

## Iniciar sesión

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"unaClaveSegura"}'
```

Devuelve un `token` JWT que se debe enviar en cada request protegido:
```
Authorization: Bearer <token>
```

## Endpoints principales

| Método | Ruta                                  | Descripción                              |
|--------|----------------------------------------|-------------------------------------------|
| POST   | /api/auth/register                     | Crear usuario (dueño)                     |
| POST   | /api/auth/login                        | Login, devuelve JWT                       |
| GET    | /api/clientes                          | Listar clientes activos con saldo actual  |
| GET    | /api/clientes?nombre=xxx               | Buscar cliente por nombre                 |
| GET    | /api/clientes/{id}                     | Detalle de cliente con saldo              |
| POST   | /api/clientes                          | Crear cliente                             |
| PUT    | /api/clientes/{id}                     | Editar cliente                            |
| DELETE | /api/clientes/{id}                     | Desactivar cliente (soft delete)          |
| GET    | /api/productos                         | Listar productos activos                  |
| POST   | /api/productos                         | Crear producto                            |
| POST   | /api/transacciones                     | Registrar CARGO (fiado) o ABONO (pago)    |
| GET    | /api/transacciones                     | Listar todas las transacciones            |
| GET    | /api/transacciones/cliente/{id}        | Historial de un cliente                   |
| GET    | /api/transacciones/cliente/{id}/saldo  | Saldo actual del cliente                  |
| GET    | /api/recursos                          | Listar catálogo de recursos (requiere USUARIOS) |
| POST   | /api/recursos                          | Crear recurso (requiere USUARIOS)         |
| GET    | /api/perfiles                          | Listar perfiles con sus recursos (requiere USUARIOS) |
| POST   | /api/perfiles                          | Crear perfil (requiere USUARIOS)          |
| PUT    | /api/perfiles/{id}/recursos             | Asignar qué recursos ve un perfil (requiere USUARIOS) |
| GET    | /api/usuarios                          | Listar usuarios con su perfil (requiere USUARIOS)  |
| PUT    | /api/usuarios/{id}/perfil               | Cambiar el perfil de un usuario (requiere USUARIOS) |

## Perfiles y recursos (control de acceso)

Cada usuario tiene un **perfil** (ej. `ADMIN`, `CAJERO`), y cada perfil tiene asignado un
conjunto de **recursos** — los módulos de la aplicación (`CLIENTES`, `PRODUCTOS`,
`TRANSACCIONES`, `REPORTES`, `USUARIOS`). Si el perfil de un usuario no tiene un recurso
asignado, la API responde `403 Forbidden` en cualquier endpoint de ese módulo — no es solo
un tema visual del frontend, se bloquea en el backend.

Al arrancar la app por primera vez, `DataSeeder` crea automáticamente:
- Los 5 recursos base (`CLIENTES`, `PRODUCTOS`, `TRANSACCIONES`, `REPORTES`, `USUARIOS`)
- Un perfil `ADMIN` con acceso a los 5

Por eso `/api/auth/register` funciona sin pedirte nada extra: si no mandás `perfilId`,
asigna `ADMIN` automáticamente.

### Crear un perfil con acceso limitado (ej. un cajero)

```json
POST /api/perfiles
{
  "nombre": "CAJERO",
  "descripcion": "Solo puede fiar y cobrar, no ve reportes ni usuarios"
}
```

Después asignale solo los recursos que necesita (mirá los `id` con `GET /api/recursos`):
```json
PUT /api/perfiles/{id}/recursos
{
  "recursoIds": [1, 3]
}
```

Y creá el usuario con ese perfil:
```json
POST /api/auth/register
{
  "username": "cajero1",
  "password": "otraClave",
  "nombreCompleto": "Juan Pérez",
  "perfilId": 2
}
```

Al loguearse, la respuesta de `/api/auth/login` incluye qué recursos puede ver:
```json
{
  "token": "...",
  "username": "cajero1",
  "nombreCompleto": "Juan Pérez",
  "perfil": "CAJERO",
  "recursos": ["CLIENTES", "TRANSACCIONES"]
}
```
El frontend usa esa lista para mostrar/ocultar secciones del menú.

**Importante**: el nombre del perfil (`ADMIN`, `CAJERO`, etc.) se usa también como rol
interno de Spring Security — usá nombres simples, en mayúsculas y sin espacios ni acentos.

## Ejemplo: registrar un fiado con productos

```json
POST /api/transacciones
{
  "clienteId": 1,
  "tipo": "CARGO",
  "descripcion": "Almuerzo",
  "detalles": [
    { "productoId": 3, "cantidad": 1 },
    { "productoId": 5, "cantidad": 2 }
  ]
}
```
El monto se calcula automáticamente a partir del precio de cada producto.

## Ejemplo: registrar un abono (pago)

```json
POST /api/transacciones
{
  "clienteId": 1,
  "tipo": "ABONO",
  "monto": 5000,
  "descripcion": "Pago parcial"
}
```

## Cómo se calcula el saldo

`saldo = suma(CARGOs) - suma(ABONOs)`. Un saldo positivo significa que el cliente debe dinero.

## Próximos pasos sugeridos
- Conectar con el frontend Angular (CORS ya configurado para `http://localhost:4200`)
- Agregar paginación en listados grandes
- Reportes: total adeudado, clientes con mayor deuda, etc.
