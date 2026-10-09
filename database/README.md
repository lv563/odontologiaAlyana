# Base de datos (PostgreSQL 17)

- Se levanta con `docker compose up -d db` desde la raíz del proyecto.
- El esquema NO se escribe a mano: lo generan las migraciones de EF Core.
- `init/` solo contiene scripts que corren la primera vez que se crea el volumen (extensiones, etc.).

Conexión de desarrollo: `Host=localhost;Port=5432;Database=odontoalyana;Username=odonto;Password=odonto_dev`

Reiniciar la BD desde cero: `docker compose down -v && docker compose up -d db`