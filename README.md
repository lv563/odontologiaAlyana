# Odonto Alyana

```
odontoalyana/
├── backend/            .NET 10 · Clean Architecture
│   └── src/
│       ├── OdontoAlyana.Domain          entidades, enums, constantes (sin dependencias)
│       ├── OdontoAlyana.Application     DTOs, abstracciones (IEmailSender)
│       ├── OdontoAlyana.Infrastructure  EF Core + Npgsql, Identity, JWT, servicios de negocio,
│       │                                notificaciones por correo, job de recordatorios
│       └── OdontoAlyana.Api             controllers (→ Application, Infrastructure)
│           └── Controllers/{Admin,User,Public}
├── database/           PostgreSQL 17 (scripts de init; el esquema lo crean las migraciones EF)
├── frontend/            React + Vite + TypeScript
│   └── src/
│       ├── landing/      landing pública (/)
│       ├── booking/      flujo de reserva de citas (/reservar)
│       ├── auth/         login / registro
│       ├── user/         versión paciente (/app) — "Mis citas"
│       ├── admin/        versión administradora (/admin) — citas, horarios, tratamientos
│       └── shared/       cliente HTTP, auth, componentes comunes
└── docker-compose.yml  PostgreSQL para desarrollo
```

## Qué hace

- **Landing pública** con el catálogo de tratamientos y botón "Reservar cita".
- **Reserva de citas**: el visitante ve los días/horarios libres y elige tratamiento y horario;
  para confirmar debe registrarse o iniciar sesión (la selección se conserva).
- Al reservar, se envía **correo** de confirmación al paciente y aviso a la clínica, y queda
  registrada la cita.
- **Panel admin**: ver/filtrar todas las citas, cambiar su estado (completar/cancelar/no asistió),
  enviar un recordatorio por correo manual, definir el **horario semanal** y **habilitar/deshabilitar
  días concretos** (feriados, aperturas extra), y gestionar el catálogo de **tratamientos**.
- **Recordatorio automático por correo**: un job en segundo plano revisa periódicamente las citas
  confirmadas y, N días antes (configurable, `Reminder:DaysBefore`, por defecto 2), envía el
  recordatorio al paciente.

## Roles
- `Admin` → `/admin` en el front, `Controllers/Admin` en el API (política `AdminOnly`)
- `User`  → `/app` en el front, `Controllers/User` en el API (política `UserOnly`)
- Rutas públicas (`Controllers/Public` + `AuthController`): landing, catálogo, disponibilidad, login/registro.

## Arrancar
```bash
docker compose up -d db                                  # base de datos
cd backend && dotnet run --project src/OdontoAlyana.Api  # API en http://localhost:5118 (aplica migraciones y siembra datos al iniciar)
cd frontend && npm run dev                                # front en http://localhost:5173
```
Comprobar: `GET http://localhost:5118/api/health`

> Esta máquina ya tenía un PostgreSQL instalado directamente en Windows, ocupando el puerto 5432.
> Por eso el contenedor Docker se publica en **5433** (ver `docker-compose.yml` y
> `ConnectionStrings:Default` en `appsettings.json`). Si esa instalación nativa no existe en otro
> equipo, puedes regresar ambos a 5432 sin problema.

Al iniciar, el backend crea automáticamente (si no existen):
- Los roles `Admin`/`User`.
- Una **cuenta admin** con los datos de `AdminSeed` en `appsettings.json` (cámbialos antes de producción; por defecto `admin@odontoalyana.com` / `CambiarClave123!`).
- Un **horario semanal** por defecto (lun-vie 8:00-17:00, sáb 8:00-12:00).
- Un catálogo inicial de **tratamientos** de ejemplo.

## Correo (opcional en desarrollo)
Si no configuras `Email` en `appsettings.json`, el sistema **no falla**: solo deja constancia en el
log y sigue funcionando (útil para probar sin credenciales reales).

- `Email`: host/puerto/usuario/contraseña SMTP + `AdminEmail` (a dónde llegan los avisos de nuevas citas).
  Se usa tanto para la confirmación de cita como para el recordatorio automático/manual.

## Migraciones
```bash
cd backend
dotnet ef migrations add <Nombre> -p src/OdontoAlyana.Infrastructure -s src/OdontoAlyana.Api -o Persistence/Migrations
```
