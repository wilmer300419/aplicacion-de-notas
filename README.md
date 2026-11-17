# NotaClara · Plataforma de notas

Los estudiantes consultan sus notas y los profesores las asignan. Hecha con **TypeScript + Express + EJS + SQLite**, siguiendo el patrón **MVC**.

## Arrancar en 3 comandos

```bash
npm install
npm run dev          # desarrollo con recarga → http://localhost:3000
```

Producción: `npm run build && npm start`

No necesitas configurar nada: la base SQLite (`data/notas.sqlite`) y su esquema se crean solos, y si está vacía se cargan datos de ejemplo.

**Cuentas de prueba** (contraseña `Demo1234!`): `profesor@demo.edu` (profesor) · `estudiante@demo.edu` (estudiante).

## Estructura (MVC)

```
src/
  models/        Acceso a datos (SQL): user, course, grade
  controllers/   Reciben la petición, validan (zod) y responden
  services/      Reglas de negocio: autenticación, libro de notas, límite de 100 %
  middleware/    auth (JWT en cookie), csrf, flash, errores
  routes/        Mapa de URLs y permisos por rol
  config/        env.ts y database.ts (esquema + datos demo)
  scripts/       create-user.ts
views/           Vistas EJS (login, student/, teacher/, partials/)
public/          CSS y JS estático
```

## Crear usuarios reales

```bash
npm run user:create -- "Nombre Apellido" correo@dominio.edu "ClaveSegura123" teacher
npm run user:create -- "Nombre Apellido" correo@dominio.edu "ClaveSegura123" student
```
Los cursos y las inscripciones viven en las tablas `courses` y `enrollments` (esquema en `src/config/database.ts`).

## Despliegue

**Docker (lo más simple):**
```bash
docker build -t notaclara .
docker run -p 3000:3000 -v notas-data:/app/data notaclara
```
El volumen `/app/data` conserva la base de datos y la clave de sesión.

**Render / Railway / Fly:** servicio Node con Build `npm install && npm run build`, Start `npm start`, y un **disco persistente** montado en `/app/data` con `DATABASE_PATH=/app/data/notas.sqlite` (sin disco, SQLite se pierde en cada despliegue). En producción real pon `SEED_DEMO=false` y define `JWT_SECRET`.

Variables opcionales: ver `.env.example`.

## Buenas prácticas incluidas

- Contraseñas con bcrypt; mismo mensaje si falla el correo o la clave; límite de 10 intentos por 15 min.
- Sesión en cookie `httpOnly` + `SameSite`; usuario y rol se revalidan en cada petición.
- Protección CSRF en todos los formularios, cabeceras seguras con Helmet y CSP estricta (sin scripts ni estilos en línea).
- Un profesor solo ve y modifica sus cursos (se valida en la consulta SQL); un estudiante solo ve lo suyo.
- SQL parametrizado, restricciones `CHECK`/`FOREIGN KEY` en la base, validación con zod.
- Endpoint `/healthz` y cierre ordenado del servidor.

## UI/UX aplicada

- Funciona sin JavaScript; el JS solo añade "Mostrar contraseña" y confirmación al eliminar.
- Accesibilidad: enlace "Saltar al contenido", etiqueta en cada campo, `role="alert"/"status"` en mensajes, foco visible, estado nunca solo por color ("Aprobando" / "En riesgo"), tablas semánticas, objetivos táctiles de 44 px.
- Responsive, modo claro/oscuro automático y respeto a `prefers-reduced-motion`.
- Errores que explican qué pasó y cómo corregirlo; estados vacíos con siguiente paso; acepta decimales con coma (4,5) o punto.
- Escala 0–5 (aprueba con 3.0) y promedio ponderado por porcentaje; se ajusta en `src/utils/grades.ts` y `src/config/database.ts`.
