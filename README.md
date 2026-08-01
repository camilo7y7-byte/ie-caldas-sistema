# Sistema de Recolección de Datos — I.E. Francisco José de Caldas

Herramienta metodológica para la investigación de maestría *"Diseño y
validación de un modelo de gobierno y arquitectura de TI fundamentado en
COBIT 2019, ITIL 4 y tecnologías IoT..."*.

Construido con **Next.js 14 (App Router)**, **PostgreSQL + Prisma**,
**Tailwind CSS**. Pensado para desplegarse gratis en **Vercel + Supabase**.

---

## 1. Requisitos previos

- Node.js 18 o superior instalado ([nodejs.org](https://nodejs.org))
- Una cuenta gratuita en [Supabase](https://supabase.com) (base de datos)
- Una cuenta gratuita en [Vercel](https://vercel.com) (hosting)
- Una cuenta en [GitHub](https://github.com) (para conectar Vercel)

## 2. Configurar la base de datos (Supabase)

1. Crea un proyecto nuevo en Supabase.
2. Ve a **Project Settings → Database → Connection string → URI**.
3. Copia esa cadena de conexión, la necesitarás en el paso 3.

## 3. Configuración local

```bash
# 1. Entra a la carpeta del proyecto
cd ie-caldas

# 2. Instala las dependencias
npm install

# 3. Copia el archivo de variables de entorno y complétalo
cp .env.example .env
# Edita .env y pega tu DATABASE_URL de Supabase,
# un SESSION_SECRET aleatorio, y tu correo en ADMIN_EMAIL

# 4. Crea las tablas en la base de datos
npx prisma db push

# 5. Crea el usuario administrador y los instrumentos base
npm run seed

# 6. Ejecuta el proyecto en tu computador
npm run dev
```

Abre `http://localhost:3000` — deberías ver la pantalla de login. Entra con
el correo que pusiste en `ADMIN_EMAIL` para acceder al Panel Administrativo.

## 4. Agregar participantes

Como administrador, ve a **Panel → Usuarios → Nuevo usuario** (o **Importar
Excel** con columnas `correo`, `rol`, `nombre`). Los roles válidos son:

- `RECTOR`
- `COORDINADOR`
- `DOCENTE_TECNOLOGIA`
- `ORIENTADOR`
- `DOCENTE_APOYO`

Cada participante entra a la misma URL, escribe su correo (y su nombre la
primera vez) y el sistema le muestra automáticamente solo los instrumentos
que le corresponden.

## 5. Ajustar qué instrumentos ve cada rol

Por defecto:
- **Matriz documental** y **Juicio de expertos**: solo el administrador
- **Entrevista**: Rector, Coordinador
- **Encuesta**: todos los roles
- **Checklist COBIT**: Docente de Tecnología, Coordinador

Esto se define en `prisma/seed.ts` (campo `assignedRoles`). Si cambias las
asignaciones, vuelve a ejecutar `npm run seed`.

## 6. Desplegar en línea (para compartir el enlace)

1. Sube esta carpeta a un repositorio de GitHub.
2. Entra a [vercel.com](https://vercel.com) → **Add New Project** → importa
   el repositorio.
3. En **Environment Variables**, agrega las mismas variables de tu `.env`
   (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`).
4. Haz clic en **Deploy**.
5. Cuando termine, Vercel te da una URL pública (ej.
   `https://ie-caldas.vercel.app`) — esa es la que compartes con los
   participantes.

## 7. Estructura del proyecto

```
prisma/schema.prisma       Modelo completo de la base de datos
prisma/seed.ts             Crea admin + instrumentos base
src/lib/                   Sesión, autorización, conexión a BD
src/app/page.tsx           Login
src/app/dashboard/         Panel del participante
src/app/instrumentos/      Los 5 instrumentos (formularios)
src/app/admin/             Panel del investigador
src/app/api/                Rutas del backend (auth, instrumentos, admin)
```

## 8. Notas de seguridad y alcance

- La autenticación es solo por correo (sin contraseña ni verificación), tal
  como se definió para este grupo cerrado de participantes. El administrador
  es responsable de precargar únicamente los correos autorizados.
- El historial de auditoría (`/admin/historial`) nunca se borra, incluso si
  se eliminan usuarios o se restaura un respaldo.
- Los respaldos (`/admin/base-datos`) se descargan como JSON. Para
  automatizar respaldos programados o subirlos a un bucket, se puede
  extender `src/app/api/admin/backup/route.ts`.
- Las evidencias (archivos) actualmente se referencian en el modelo
  `Evidence`, pero la subida física de archivos a un bucket (Supabase
  Storage) queda como siguiente paso de integración si se requiere adjuntar
  imágenes/PDFs desde los formularios.

## 9. Soporte

Si algo no funciona como se espera, revisa primero:
- Que `DATABASE_URL` sea exactamente la que te dio Supabase (con la
  contraseña real, no `[YOUR-PASSWORD]`).
- Que hayas corrido `npx prisma db push` antes de `npm run seed`.
- Los logs de Vercel (**Deployments → ver logs**) si el error ocurre en
  producción.
