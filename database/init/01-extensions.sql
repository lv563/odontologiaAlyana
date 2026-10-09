-- Se ejecuta solo la primera vez que se crea el volumen.
-- El esquema de tablas lo gestionan las migraciones de EF Core (backend/src/OdontoAlyana.Infrastructure).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";