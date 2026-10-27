# Integracion de Profesionales y Disponibilidades

## Estado de Git

Rama: asignar-turno-sin-superposicion. Se verifico que no habia cambios versionados ni preparados antes de iniciar. Se ejecuto fetch origin y merge --no-commit --no-ff origin/develop, desde HEAD 200f40a contra c62b719. No se creo commit ni se hizo push o rebase. El merge permanece pendiente de commit para revision, con conflictos resueltos y el backend en el indice. AGENTS.md y docs/ permanecen sin seguimiento.

Los dos conflictos fueron availability.module.ts y availability.controller.ts. Se conservo el guard centralizado, la exportacion del repositorio y el controlador delgado; la relacion ORM con Profesional incorporada por develop se conserva con el nombre de FK de la migracion.

## Identidad y seguridad

PersistedProfessionalIdentityResolver implementa el contrato existente y reutiliza ProfesionalesService.buscarPorUsuario. Este servicio consulta la relacion persistida usuario.idUsuario usando JWT.sub; el adaptador devuelve idProfesional solamente si es entero positivo y fechaBaja es estrictamente null. Un usuario invalido o profesional ausente/inactivo no obtiene identidad: ProfessionalIdentityGuard responde 403. Un fallo de consulta responde 503 generico, sin detalles SQL.

AuthModule registra una sola implementacion del resolver e importa el modulo original de Profesionales. No se copiaron entidades ni se duplicaron relaciones. Los guards globales y la validacion tipada de JWT de nuestra rama permanecen intactos. Los tres endpoints de agenda usan el mismo guard, con una consulta de identidad por solicitud y sin aceptar professionalId del cliente.

El modulo de Pacientes no se integro. UnconfiguredPatientAccessFactory permanece intacto y siempre deniega: POST /appointments con identidad activa y entrada valida/futura devuelve 404 generico, sin guardar. Cuando se integre Pacientes se deben comprobar pertenencia persistida y habilitacion profesional dentro del contexto transaccional, antes de habilitar escrituras.

## Persistencia

AppModule y data-source.ts utilizan databaseEntities. Se registran una unica vez Usuario, Rol, Profesional, Especialidad, TipoDocumento, AvailabilityOrmEntity y AppointmentOrmEntity. synchronize permanece false. Se normalizo la conversion numerica de DB_PORT en AppModule para mantener coherencia con el CLI.

AvailabilityOrmEntity conserva su columna professional_id y la relacion ManyToOne con la entidad original Profesional. JoinColumn declara foreignKeyConstraintName FK_availabilities_profesional, igual que la migracion integrada.

Se conservaron sin cambios de produccion todos los archivos de appointments, los guards y las dos migraciones de Turnos respecto al HEAD anterior al merge. La auditoria, politica de estados, zona horaria, grilla, fechas civiles, transaccion, bloqueos y exclusion GiST siguen vigentes.

## Migraciones: orden de archivos, no estado aplicado

1. 1790624349036-CreateUsuariosRoles.ts
2. 1790625149305-InsertRolesIniciales.ts
3. 1790702655133-CreateProfesionalesEspecialidades.ts
4. 1790703530944-AddFechaBajaEspecialidad.ts
5. 1790705382288-SeedTiposDocumento.ts
6. 1790707430491-CreateAvailabilities.ts
7. 1792108800000-CreateAppointments.ts
8. 1792195200000-ProtectAppointmentBookings.ts
9. 1792518488637-AddForeignKeyAvailabilityProfesional.ts

No se ejecutaron migraciones ni consultas a PostgreSQL y no se leyo .env. No se puede afirmar cuales migraciones estan aplicadas ni si existen filas incompatibles.

Antes de aplicar la FK de disponibilidades se deben revisar filas huerfanas y registros creados con el antiguo id fijo. Que ese numero exista no demuestra propiedad correcta. No reasignar registros automaticamente. La exclusion de Turnos requiere btree_gist y datos compatibles; las FK a Paciente y Profesional de Turnos siguen pendientes de sus integraciones definitivas.

## Verificaciones

- Build aprobado.
- TypeScript incluyendo los tests aprobado.
- Suite completa: 157 pruebas aprobadas, 7 pruebas PostgreSQL omitidas; 15 suites aprobadas y una omitida.
- Resolver real: activo, inexistente, dado de baja, identidad invalida y fallo de persistencia.
- Integracion HTTP con modulos, servicio de Profesionales, resolver, guards y adaptador cerrado de pacientes reales; solo la persistencia y el reloj estan simulados, sin leer .env.
- Se verifico la consulta persistida por idUsuario, el uso de un idProfesional distinto, una sola resolucion por solicitud y la denegacion de agendas ajenas.
- Se corrigieron cuatro tests antiguos de Auth/Usuarios que omitian providers. Ahora prueban delegacion, claims del JWT, credenciales y seleccion explicita del hash para login tras select:false. No se cambio su logica de produccion.
- Metadatos de siete entidades, relacion OneToOne obligatoria y unica con Usuario, FK de disponibilidades y restricciones/auditoria de Turnos verificados sin conectar a una base.
- ESLint de los archivos de integracion aprobado sin --fix. ESLint global devuelve 257 errores preexistentes (242 de formato y 15 de tipado/imports), cero advertencias. Se comprobo que todos pertenecen a archivos identicos a HEAD anterior o a origin/develop; no se reestructuraron modulos ajenos para resolverlos.
- No se verifico la concurrencia real de PostgreSQL ni se ejecutaron pruebas con modificaciones de datos.

## Postman, una vez preparado el esquema con autorizacion

- POST /auth/login: login existente y JWT con sub igual al idUsuario.
- GET /auth/me y GET /profesionales/me: identidad propia; no confundir idUsuario e idProfesional.
- POST /availabilities con JWT PROFESIONAL activo: 201. Verificar professionalId persistido desde backend y rechazo 400 si se envia ese campo.
- GET /appointments/free-slots?date=YYYY-MM-DD: 200 con intervalos propios, grilla y ocupacion existentes. professionalId adicional -> 400.
- Los tres endpoints de agenda sin token -> 401; rol ADMINISTRADOR -> 403; profesional inexistente o dado de baja -> 403.
- POST /appointments con datos validos y futuros, profesional activo y cualquier paciente: 404 generico mientras PatientAccessFactory siga cerrado. No debe guardar ningun turno.
- No probar 201 real ni concurrencia de asignacion hasta integrar autorizacion persistida de pacientes y comprobar las migraciones. No cambiar providers para forzar acceso.

## Archivos del backend preparados en el indice

- backend/src/app.module.ts
- backend/src/auth/auth.controller.spec.ts
- backend/src/auth/auth.controller.ts
- backend/src/auth/auth.module.ts
- backend/src/auth/auth.service.spec.ts
- backend/src/auth/decorators/usuario-actual.decorator.ts
- backend/src/auth/infrastructure/professional-identity.resolver.spec.ts
- backend/src/auth/infrastructure/professional-identity.resolver.ts
- backend/src/auth/interfaces/usuario-autenticado.interface.ts
- backend/src/auth/professional-identity.resolver.ts
- backend/src/auth/professional-integration.spec.ts
- backend/src/auth/security.spec.ts
- backend/src/database/entities.spec.ts
- backend/src/database/entities.ts
- backend/src/especialidades/dto/create-especialidad.dto.ts
- backend/src/especialidades/dto/update-especialidad.dto.ts
- backend/src/especialidades/entities/especialidad.entity.ts
- backend/src/especialidades/especialidades.controller.ts
- backend/src/especialidades/especialidades.module.ts
- backend/src/especialidades/especialidades.service.ts
- backend/src/migrations/1790702655133-CreateProfesionalesEspecialidades.ts
- backend/src/migrations/1790703530944-AddFechaBajaEspecialidad.ts
- backend/src/migrations/1790705382288-SeedTiposDocumento.ts
- backend/src/migrations/1792518488637-AddForeignKeyAvailabilityProfesional.ts
- backend/src/modules/availabilities/infrastructure/persistence/availability.orm-entity.ts
- backend/src/profesionales/dto/create-profesional.dto.ts
- backend/src/profesionales/entities/profesional.entity.ts
- backend/src/profesionales/entities/tipo-documento.entity.ts
- backend/src/profesionales/profesionales.controller.ts
- backend/src/profesionales/profesionales.module.ts
- backend/src/profesionales/profesionales.service.ts
- backend/src/usuarios/entities/usuario.entity.ts
- backend/src/usuarios/usuarios.controller.spec.ts
- backend/src/usuarios/usuarios.service.spec.ts
- backend/src/usuarios/usuarios.service.ts

Documentacion actualizada: docs/ASIGNAR_TURNOS.md, docs/CONTEXTO_ARMONIA.md y este informe.
