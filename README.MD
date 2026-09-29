# Armonía

Sistema de Gestión para Centros de Atención Terapéutica desarrollado como proyecto de **Seminario Integrador - Ingeniería en Sistemas de Información, UTN FRVM**.

El sistema permite gestionar profesionales, pacientes, procesos terapéuticos, historias clínicas, turnos, disponibilidad horaria, tarifas y cobros.

---

## Tecnologías utilizadas

### Backend
- NestJS
- TypeScript
- TypeORM

### Frontend
- Angular
- Angular Material

### Base de datos
- PostgreSQL
- Docker

---

# Requisitos previos

Antes de ejecutar el proyecto es necesario tener instalado:

- Node.js
- npm
- Git
- Docker Desktop

Opcionalmente se puede instalar NestJS CLI de forma global:

```bash
npm install -g @nestjs/cli
```

Para comprobar la instalación:

```bash
nest --version
```

---

---

# Base de datos

La base de datos PostgreSQL se ejecuta mediante Docker.

Por lo tanto, **no es necesario instalar PostgreSQL localmente**.

Antes de levantar la base de datos, asegurarse de que **Docker Desktop esté abierto**.

Desde la raíz del proyecto ejecutar:

```bash
docker compose up -d
```

Para comprobar que el contenedor está funcionando:

```bash
docker ps
```

Debería aparecer el contenedor correspondiente a PostgreSQL.

## Detener la base de datos

```bash
docker compose down
```

Este comando detiene el contenedor pero **conserva los datos almacenados**.


# Variables de entorno

El backend utiliza variables de entorno para conectarse con PostgreSQL.

El archivo:

```text
backend/.env
```

NO se encuentra en GitHub por motivos de seguridad.

Cada integrante del equipo debe crear su propio archivo `.env`. con la siguiente estructura:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=armonia

JWT_SECRET=colocar_clave_local
```

> Nunca subir el archivo `.env` al repositorio.

---

# Backend

Ingresar a:

```bash
cd backend
```

La primera vez que se descarga el proyecto hay que instalar las dependencias:

```bash
npm install
```

Luego ejecutar NestJS en modo desarrollo:

```bash
npm run start:dev
```

El modo `start:dev` reinicia automáticamente el servidor cuando se detectan cambios en el código.

Por defecto, el backend se ejecutará en:

```text
http://localhost:3000
```

---

# Frontend

Desde la raíz del proyecto:

```bash
cd frontend
```

Instalar las dependencias:

```bash
npm install
```

Ejecutar Angular:

```bash
npm start
```

El frontend estará disponible normalmente en:

```text
http://localhost:4200
```

---

# Levantar el proyecto completo

Una vez configurado el proyecto por primera vez, para comenzar a trabajar normalmente se debe seguir este orden.

## 1. Abrir Docker Desktop

Esperar a que Docker termine de iniciar.

## 2. Levantar PostgreSQL

Desde la raíz del proyecto:

```bash
docker compose up -d
```

## 3. Levantar el backend

En una terminal:

```bash
cd backend
npm run start:dev
```

## 4. Levantar el frontend

En otra terminal:

```bash
cd frontend
npm start
```

La arquitectura local queda de la siguiente manera:

```text
Angular
localhost:4200
      │
      ▼
NestJS
localhost:3000
      │
      ▼
TypeORM
      │
      ▼
PostgreSQL
Docker :5432
```

---

# Estructura general

```text
armonia/
│
├── backend/
│   ├── src/
│   ├── .env
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

# Solución de problemas

## NestJS no encuentra dependencias

Ejecutar dentro de `/backend`:

```bash
npm install
```

## Angular no encuentra dependencias

Ejecutar dentro de `/frontend`:

```bash
npm install
```

## PostgreSQL no inicia

Comprobar primero que Docker Desktop esté ejecutándose.

Luego:

```bash
docker ps
```

Si el contenedor no está levantado:

```bash
docker compose up -d
```

## El backend no puede conectarse a PostgreSQL

Comprobar:

1. Que Docker Desktop esté abierto.
2. Que el contenedor PostgreSQL esté funcionando.
3. Que exista `backend/.env`.
4. Que las credenciales del `.env` coincidan con las configuradas en `docker-compose.yml`.
5. Que el puerto `5432` esté disponible.

---

# Equipo

Proyecto desarrollado por el **Grupo M** para Seminario Integrador - UTN Facultad Regional Villa María.

- Anselmi, Lara
- Lencina, Guadalupe Ayelen
- Miloc, Daniela Laura
- Oliva, Milagros Victoria
- Villoria, Federico Martin