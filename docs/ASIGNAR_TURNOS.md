# Asignar turno sin superposiciones

## Alcance y estado

POST /appointments esta implementado. Requiere JWT, rol PROFESIONAL e identidad profesional resuelta en backend. La identidad profesional ya se resuelve con el modulo original de Profesionales; un profesional inexistente o dado de baja recibe 403. La integracion se verifico con persistencia simulada, no contra PostgreSQL.

Cada paciente pertenece a un unico profesional. La referencia local origin/RegistrarPacientes ofrece findByIdAndProfessional, pero su implementacion busca solo por idPaciente y no garantiza pertenencia. No se copiaron entidades ni se modifico ese modulo. PatientAccessFactory entrega actualmente un acceso que siempre deniega; aunque el profesional activo se resuelve correctamente, una solicitud valida y futura recibe 404 generico mientras falte la integracion de pacientes.

## Contrato y reglas confirmadas

Entrada: patientId (entero positivo), date (fecha civil YYYY-MM-DD) y startTime (HH:mm).

No admite professionalId, endTime, duration, status ni campos de auditoria enviados por el cliente.

El backend identifica al profesional; autoriza al paciente con datos persistidos; calcula el dia, vigencia inclusiva y grilla; deriva fin y duracion. Los intervalos son semiabiertos [inicio, fin). Se descartan sobrantes y se eliminan intervalos duplicados. Si el mismo inicio admite duraciones diferentes se rechaza con 409.

El inicio debe ser estrictamente futuro en America/Argentina/Buenos_Aires, sin anticipacion minima. Se valida antes de abrir la transaccion y se vuelve a comprobar despues de consultas y bloqueos, antes de guardar. Las fechas civiles siguen representadas a medianoche UTC en los contratos Date; esa representacion no es el instante de inicio del turno.

El estado inicial siempre es RESERVED. RESERVED, CONFIRMED, ATTENDED y NOT_ATTENDED bloquean. CANCELLED y RESCHEDULED liberan el horario original. Esta operacion no cobra, confirma, cancela ni reprograma.

La respuesta 201 incluye id, patientId, date, startTime, endTime y status; no incluye entidades relacionadas ni datos clinicos.

Errores: 400 entrada, futuro o grilla invalidos; 401 JWT ausente o invalido; 403 rol o identidad no habilitados; 404 paciente inexistente o no autorizado, sin distinguirlos; 409 ocupacion o ambiguedad; 500 configuracion de agenda invalida; 503 fallo de persistencia sin SQL ni parametros en la respuesta.

## Arquitectura y transaccion

El modulo slot-calculator.ts comparte reglas puras entre GetFreeSlotsService y CreateAppointmentService. La politica de estados bloqueantes esta centralizada en dominio.

AppointmentTransaction expone un contexto con contratos de repositorios y PatientAccess, sin EntityManager ni QueryRunner en dominio o aplicacion. El adaptador TypeORM usa READ COMMITTED y crea ambos repositorios con el mismo EntityManager de la transaccion. Bloquea las disponibilidades existentes del profesional/dia con FOR SHARE, ordenadas por id, antes de usarlas. No hay bloqueos en memoria.

La futura implementacion de PatientAccessFactory debe consultar y proteger el vinculo persistido usando el manager recibido. El resolver de Profesionales ya comprueba fechaBaja antes de la operacion. Cuando se habilite la autorizacion real de pacientes, tambien se debe coordinar la habilitacion profesional con la transaccion antes de permitir escrituras. No basta con reemplazar los adaptadores por implementaciones que solo revisen existencia.

Los bloqueos protegen las filas existentes, no impiden insertar nuevas disponibilidades. Si se incorporan cambios concurrentes de configuracion, su coordinacion debe conservar la consistencia del conjunto de bloques. La garantia contra superposiciones de turnos depende de la restriccion de base de datos y no de esos bloqueos.

## Migraciones pendientes: no ejecutadas

1. 1792108800000-CreateAppointments.ts: tabla y enum iniciales; conservada sin cambios.
2. 1792195200000-ProtectAppointmentBookings.ts: btree_gist, columnas de auditoria, FK del creador a usuarios, CHECK start_time < end_time y EXCLUDE USING gist por profesional y rango civil [inicio, fin), parcial para los cuatro estados bloqueantes.

La exclusion protege INSERT y UPDATE incluso desde conexiones concurrentes. El codigo traduce exclusivamente 23P01 de EX_appointments_professional_time a conflicto de negocio despues del rollback. Otros errores se responden sin detalles internos. No se habilita una alternativa insegura si falta la extension o la restriccion.

createdAt y updatedAt se generan con TypeORM y valores predeterminados de PostgreSQL. createdByUserId se obtiene de request.user.sub y referencia al Usuario existente. Permanece nullable para filas anteriores; no se inventa el creador historico. Para registros previos, las nuevas fechas predeterminadas representan el momento de migracion, no su fecha historica real. updatedAt se actualiza en escrituras realizadas por TypeORM; SQL externo requiere gestion explicita.

La nueva migracion requiere permisos para btree_gist y falla si hay datos incompatibles: no los corrige ni elimina. Su down automatico esta bloqueado para conservar auditoria y proteccion; cualquier reversion requiere un plan manual aprobado. Las FK de paciente y profesional quedan pendientes de integrar sus modelos originales. synchronize permanece false.

## Pruebas y uso manual

Las pruebas de servicio usan identidad y repositorios simulados. Cubren autorizacion del paciente, fecha y zona horaria, grilla, vigencia, ambiguedad, estados, solapamientos, contiguidad, errores y rollback simulado. Las pruebas HTTP mantienen los guards reales y prueban POST y regresion de GET.

postgres-concurrency.spec.ts es optativa: no lee .env ni usa la configuracion de desarrollo. Requiere ARMONIA_BOOKING_TEST_URL apuntando explicitamente a una base dedicada cuyo nombre empiece por armonia_appointments_test. Crea y elimina solo su esquema aleatorio y prepara fixtures SQL, sin ejecutar migraciones. Comprueba una carrera con dos conexiones, conflictos parciales y exactos, estados, contiguidad y actualizaciones. El motor Docker no estaba disponible durante esta implementacion; no se verifico concurrencia real.

Postman, estado actual: sin JWT -> 401; token de ADMINISTRADOR -> 403; profesional inexistente o dado de baja -> 403. Un profesional activo puede registrar disponibilidades y consultar horarios libres una vez aplicado el esquema necesario. Una asignacion valida y futura recibe 404 generico por la autorizacion pendiente de Pacientes. No cambiar providers de produccion para forzar un 201.

Luego de integrar ambos modulos y ejecutar las migraciones con autorizacion: usar un paciente propio, disponibilidad vigente y fecha futura; esperar 201. Repetir o solapar -> 409; horario contiguo -> 201; paciente ajeno o inexistente -> mismo 404; inicio pasado o fuera de grilla -> 400; campos adicionales -> 400. Probar dos solicitudes simultaneas para un mismo intervalo: solo una puede confirmar su transaccion.

## Archivos de esta implementacion

Creados:

- backend/src/migrations/1792195200000-ProtectAppointmentBookings.ts
- backend/src/modules/appointments/application/dto/appointment-response.dto.ts
- backend/src/modules/appointments/application/dto/create-appointment.dto.ts
- backend/src/modules/appointments/application/ports/appointment-transaction.ts
- backend/src/modules/appointments/application/ports/clock.ts
- backend/src/modules/appointments/application/ports/patient-access.ts
- backend/src/modules/appointments/application/services/create-appointment.service.spec.ts
- backend/src/modules/appointments/application/services/create-appointment.service.ts
- backend/src/modules/appointments/domain/entities/appointment.entity.spec.ts
- backend/src/modules/appointments/domain/exceptions/appointment.exception.ts
- backend/src/modules/appointments/domain/policies/blocking-appointment-statuses.ts
- backend/src/modules/appointments/domain/services/center-time.ts
- backend/src/modules/appointments/domain/services/slot-calculator.ts
- backend/src/modules/appointments/infrastructure/system-clock.ts
- backend/src/modules/appointments/infrastructure/transactions/patient-access.factory.ts
- backend/src/modules/appointments/infrastructure/transactions/postgres-concurrency.spec.ts
- backend/src/modules/appointments/infrastructure/transactions/typeorm-appointment.transaction.spec.ts
- backend/src/modules/appointments/infrastructure/transactions/typeorm-appointment.transaction.ts
- backend/src/modules/appointments/presentation/filters/appointment-exception.filter.ts
- docs/ASIGNAR_TURNOS.md

Modificados:

- backend/src/auth/security.spec.ts
- backend/src/database/entities.spec.ts
- backend/src/modules/appointments/application/services/get-free-slots.service.spec.ts
- backend/src/modules/appointments/application/services/get-free-slots.service.ts
- backend/src/modules/appointments/appointments.module.ts
- backend/src/modules/appointments/domain/entities/appointment.entity.ts
- backend/src/modules/appointments/infrastructure/persistence/appointment.orm-entity.ts
- backend/src/modules/appointments/infrastructure/repositories/typeorm-appointment.repository.spec.ts
- backend/src/modules/appointments/infrastructure/repositories/typeorm-appointment.repository.ts
- backend/src/modules/appointments/presentation/controllers/appointment.controller.ts
- docs/CONTEXTO_ARMONIA.md

## Verificacion realizada

Build aprobado. Comprobacion TypeScript incluyendo tests aprobada. ESLint de componentes nuevos y refactorizados aprobado sin --fix. Pruebas seleccionadas: 131 aprobadas y 7 de PostgreSQL omitidas. Los 68 casos de ambos servicios tambien pasaron bajo America/Los_Angeles y Pacific/Kiritimati. git diff --check aprobado. No se ejecutaron migraciones ni se hicieron cambios en datos reales, commits, push o integraciones Git.
