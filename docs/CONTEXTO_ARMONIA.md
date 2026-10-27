# Armonia - Contexto funcional y tecnico

> Documento de continuidad actualizado el 2026-10-27 para retomar el proyecto en una nueva conversacion de Codex. Distinguir reglas confirmadas, implementacion en archivos y funcionamiento verificado. No asumir que el esquema de PostgreSQL esta actualizado ni que un endpoint fue probado contra una base real.

## 1. Punto de partida para la siguiente conversacion

1. Leer AGENTS.md y este documento antes de modificar codigo.
2. Comprobar rama, status, indice y existencia de MERGE_HEAD: el usuario puede haber confirmado y publicado el merge despues de esta captura.
3. Conservar todo el trabajo existente. No iniciar otra integracion ni nuevas funcionalidades sin instrucciones.
4. No ejecutar migraciones, modificar PostgreSQL, hacer commits o push sin autorizacion expresa.
5. No habilitar la autorizacion de pacientes para probar asignacion. POST /appointments debe continuar cerrado hasta implementar pertenencia persistida y segura.

AGENTS.md se conserva sin cambios. Sus hallazgos de auditoria del inicio del proyecto son historicos: la falta de modulo de Turnos, rutas de persistencia y profesional fijo ya fueron corregidos. Ante una contradiccion nueva entre documentos, instrucciones y codigo, senalarla antes de tomar decisiones de negocio.

## 2. Estado de Git al cerrar esta etapa

- Directorio: D:\UTN\Seminario\armonia.
- Rama activa: asignar-turno-sin-superposicion.
- HEAD: 200f40a, feat: implementar asignacion de turnos sin superposiciones.
- Se ejecuto git fetch origin durante la integracion anterior.
- Se incorporo origin/develop, commit c62b719, mediante git merge --no-commit --no-ff origin/develop.
- MERGE_HEAD sigue apuntando a c62b719: el merge esta preparado, pero todavia NO existe su commit.
- Conflictos encontrados y resueltos: availability.module.ts y availability.controller.ts.
- No quedan entradas sin resolver en el indice ni marcadores de conflicto en backend/src.
- Hay 35 archivos del backend preparados en el indice, correspondientes a Profesionales, Especialidades, autenticacion, entidades, migraciones y pruebas de integracion.
- No hay cambios versionados fuera del indice. AGENTS.md y docs/ siguen sin seguimiento; esta actualizacion de contexto tampoco esta preparada todavia.
- No se hizo rebase, cambio de rama, commit o push. No se modifico PostgreSQL.

La integracion mantuvo nuestros controladores delgados y el guard centralizado; conservo los modulos y entidades originales del equipo. El contenido de produccion de Turnos, sus dos migraciones y nuestros guards quedo identico al HEAD anterior al merge.

## 3. Objetivo, alcance y arquitectura

Armonia es un sistema web de gestion para centros terapeuticos. El alcance acordado incluye profesionales, especialidades, pacientes, disponibilidades, turnos, historias clinicas, procesos terapeuticos, tarifas, cobros e indicadores. El alcance acordado no implica que todos esos modulos esten implementados o integrados.

La autenticacion corresponde a usuarios internos y profesionales, no a pacientes. El aislamiento entre profesionales y la proteccion de datos clinicos son requisitos centrales.

- Backend: NestJS 11, TypeORM y PostgreSQL; monolito modular, no microservicios.
- Frontend de esta rama: Angular 19 standalone, Angular Material y Tailwind configurado. Sigue con rutas vacias y pantalla inicial; no tiene integracion funcional de negocio en esta rama.
- Nuevos modulos: mantener domain, application, infrastructure y presentation cuando corresponda. Dominio independiente de NestJS y TypeORM; controladores delegan en casos de uso; persistencia implementa contratos.
- Usar availabilities como referencia de integracion modular y appointments para contratos, mapeos y reglas compartidas. No replicar defectos ni reestructurar otros modulos sin autorizacion.
- Nuevas carpetas de persistencia: persistence. Conservar convenciones reales; codigo nuevo y endpoints en ingles, comentarios/documentacion en espanol sin tildes y errores al usuario en espanol con tildes.
- Roles reales existentes: ADMINISTRADOR y PROFESIONAL. No renombrarlos ni ampliar permisos administrativos implicitamente.
- Referencia visual acordada, aun no aplicada: verdes #E8F5E9, #A5D6A7, #66BB6A, #1B5E20; #37474F y #FFFFFF; tipografias Poppins / Inter.

## 4. Funcionalidades presentes en el backend

### Usuarios y autenticacion

- Alta de usuarios restringida a ADMINISTRADOR; consulta interna por correo, bcrypt y login JWT.
- JWT.sub representa Usuario.idUsuario, nunca Profesional.idProfesional.
- Guards globales de JWT y roles; validacion tipada de claims y DTO con whitelist, forbidNonWhitelisted y transform.
- Usuario.contrasena tiene select:false. La consulta usada por login selecciona el hash explicitamente. Ambos cambios deben conservarse juntos.
- GET /auth/me devuelve la identidad autenticada.

### Profesionales y especialidades

Se incorporaron desde origin/develop los modulos originales, previamente desarrollados en feature/profesionales-especialidades y feature/integracion-disponibilidad-profesionales.

- Profesional tiene idProfesional propio y relacion OneToOne obligatoria con Usuario mediante idUsuario, respaldada por FK y unicidad.
- Relaciones originales con TipoDocumento y Especialidad; fechaBaja opcional en Profesional.
- Registro de profesional crea Usuario y Profesional en una transaccion, con rol PROFESIONAL, sin exponer la contrasena en la respuesta.
- GET /profesionales/me obtiene el profesional propio.
- Especialidades incluye operaciones administrativas y baja logica segun el modulo integrado.

### Identidad profesional para agendas

- Contrato: backend/src/auth/professional-identity.resolver.ts.
- Implementacion: auth/infrastructure/professional-identity.resolver.ts, clase PersistedProfessionalIdentityResolver.
- Reutiliza ProfesionalesService.buscarPorUsuario(userId), que consulta la relacion persistida usuario.idUsuario.
- Solo devuelve idProfesional positivo y seguro si fechaBaja es estrictamente null.
- Profesional inexistente o dado de baja: identidad no resuelta y ProfessionalIdentityGuard responde 403.
- Fallo de consulta de identidad: 503 generico, sin SQL ni datos personales.
- AuthModule registra el adaptador real e importa ProfesionalesModule. Ya no registra un resolver provisional.
- POST /availabilities, GET /appointments/free-slots y POST /appointments utilizan el mismo ProfessionalIdentityGuard y una resolucion de identidad por solicitud.
- No se acepta professionalId del cliente para elegir una agenda propia.

ProfesionalesService.buscarPorUsuario no filtra fechaBaja por si mismo; esa comprobacion para agendas se realiza en el resolver. No asumir que consultar un perfil y autorizar una operacion de agenda tienen reglas identicas.

### Disponibilidades

POST /availabilities registra bloques del profesional autenticado, con DTO, validaciones de dominio y consulta previa de superposicion de horario y vigencia. AVAILABILITY_REPOSITORY permanece exportado.

AvailabilityOrmEntity conserva professional_id y una relacion ManyToOne con la entidad original Profesional. La FK se llama FK_availabilities_profesional, tanto en los metadatos como en la migracion.

La creacion de disponibilidades valida superposiciones mediante consulta previa; no confundirla con la garantia concurrente de asignacion de turnos. Una futura edicion/eliminacion o insercion concurrente de configuracion requiere coordinacion adicional.

### Consulta de horarios libres

GET /appointments/free-slots?date=YYYY-MM-DD esta implementado en GetFreeSlotsService. Solo consulta la agenda propia, sin revelar pacientes o turnos ocupados. Sin intervalos disponibles devuelve 200 con slots vacio.

- Obtiene bloques por profesional y dia de semana.
- Aplica vigencia inclusiva, duracion del bloque y grilla consecutiva desde startTime.
- Descarta sobrantes incompletos y elimina intervalos duplicados.
- Excluye solapamientos parciales o totales con turnos bloqueantes usando intervalos [inicio, fin).
- Permite fechas pasadas y todos los horarios del dia actual.
- Usa fechas civiles YYYY-MM-DD; los contratos Date las representan a medianoche UTC, sin conversion a hora local.

### Asignacion de turnos

POST /appointments, CreateAppointmentService, DTOs, entidad, persistencia y transaccion estan implementados y probados con simulaciones.

Entrada permitida: patientId, date y startTime. El backend determina profesional, fin, duracion, estado y usuario creador.

- Estado inicial: RESERVED. No confirma cobros ni cambia estados posteriores.
- Inicio estrictamente futuro en America/Argentina/Buenos_Aires, sin anticipacion adicional. Se valida antes de abrir la transaccion y nuevamente despues de consultas/bloqueos, antes de guardar.
- Duracion desde Availability.duration; solo intervalos completos de una grilla vigente.
- Mismo inicio con duraciones distintas: 409.
- Estados bloqueantes: RESERVED, CONFIRMED, ATTENDED y NOT_ATTENDED.
- CANCELLED y RESCHEDULED no bloquean el horario original. Una futura reprogramacion debe crear un turno vigente para el nuevo horario, conservando el original historico.
- Intervalos semiabiertos [inicio, fin), permitiendo turnos consecutivos.
- createdAt y updatedAt automaticos; createdByUserId se obtiene de JWT.sub y referencia al Usuario original.
- Reglas de calculo y politica de estados compartidas entre consulta y asignacion; no duplicarlas.

**BLOQUEO VIGENTE: POST /appointments NO permite asignar pacientes hasta integrar su pertenencia persistida y segura al profesional.**

PatientAccessFactory sigue registrado con UnconfiguredPatientAccessFactory, que siempre deniega. Con identidad profesional activa y entrada valida/futura, el POST devuelve 404 generico sin guardar. Una entrada invalida o pasada puede recibir 400 antes de llegar a esa comprobacion. No habilitar un proveedor permisivo ni datos ficticios para forzar 201 real.

## 5. Dependencia pendiente de Pacientes

Regla confirmada: cada paciente pertenece a un unico profesional; un profesional puede tener multiples pacientes. Paciente inexistente o ajeno: mismo 404 generico, sin revelar existencia.

En la referencia origin/RegistrarPacientes revisada tras el fetch anterior:

- PatientOrmEntity no persiste propietario ni FK a Profesional.
- findByIdAndProfessional filtra solo por paciente; findAllByProfessional no aplica el filtro de profesional.
- Creacion/actualizacion no garantizan pertenencia.
- El controlador utiliza un profesional fijo y cuerpos any.
- Hay discrepancia entre el token inyectado IPatientRepository y el registrado PatientRepository, ademas del tipo inexistente Patiente.
- La intencion antigua de vincular por proceso terapeutico no garantiza la regla confirmada.

No integrar estos defectos ni autorizar por existencia. Coordinar el modelo original y una migracion de pertenencia con el equipo, sin copiar entidades. El adaptador real de PatientAccessFactory debe comprobar y proteger el vinculo usando el EntityManager recibido por la infraestructura transaccional.

Antes de habilitar escrituras de Turnos, coordinar tambien la habilitacion profesional dentro de la transaccion y revisar las FK definitivas de Turnos a Paciente y Profesional. No se necesita una exclusion adicional de pacientes entre agendas si se respeta su propietario unico.

## 6. Persistencia y concurrencia

AppModule y data-source.ts comparten databaseEntities. Contiene una unica instancia de las clases originales Usuario, Rol, Profesional, Especialidad, TipoDocumento, AvailabilityOrmEntity y AppointmentOrmEntity. Se comprobaron sus metadatos sin conexion a PostgreSQL. synchronize permanece false.

AppointmentTransaction expone contratos, sin EntityManager ni QueryRunner en dominio/aplicacion. El adaptador TypeORM usa READ COMMITTED y crea repositorios con el mismo manager. Bloquea disponibilidades existentes con FOR SHARE y orden consistente por id.

La garantia contra reservas concurrentes depende de la restriccion PostgreSQL EX_appointments_professional_time: exclusion GiST por professional_id e intervalo tsrange(date + start_time, date + end_time, '[)'), parcial para los cuatro estados bloqueantes. CHECK exige start_time < end_time. Requiere btree_gist.

Un 23P01 de esa restriccion se traduce a 409 despues del rollback. No alcanza con consultar horarios libres antes de guardar. Los bloqueos de filas existentes no impiden insertar nuevos bloques de disponibilidad.

Errores de asignacion: 400 entrada/futuro/grilla; 401 autenticacion; 403 rol/identidad profesional; 404 paciente inexistente o no autorizado; 409 ocupacion/ambiguedad; 500 configuracion de agenda invalida; 503 persistencia. No exponer detalles internos ni informacion clinica.

## 7. Migraciones y precauciones antes de ejecutar

Este es el orden de archivos disponibles, NO el estado aplicado en una base:

| Orden | Archivo | Efecto principal |
|---|---|---|
| 1 | 1790624349036-CreateUsuariosRoles.ts | Usuarios, roles y FK |
| 2 | 1790625149305-InsertRolesIniciales.ts | Roles ADMINISTRADOR y PROFESIONAL |
| 3 | 1790702655133-CreateProfesionalesEspecialidades.ts | Profesionales, especialidades, tipos de documento y relaciones |
| 4 | 1790703530944-AddFechaBajaEspecialidad.ts | Baja logica de especialidad |
| 5 | 1790705382288-SeedTiposDocumento.ts | Tipos de documento iniciales |
| 6 | 1790707430491-CreateAvailabilities.ts | Tabla y enum de disponibilidades |
| 7 | 1792108800000-CreateAppointments.ts | Tabla y enum de turnos |
| 8 | 1792195200000-ProtectAppointmentBookings.ts | Auditoria, FK a Usuario, CHECK y exclusion GiST |
| 9 | 1792518488637-AddForeignKeyAvailabilityProfesional.ts | FK de disponibilidades a Profesional |

Las dos migraciones de Turnos estaban pendientes segun el contexto de trabajo. No se consulto la tabla de migraciones ni PostgreSQL, por lo que el estado real de todas ellas debe comprobarse antes de actuar. No se ejecuto ninguna durante esta etapa.

Antes de autorizar su ejecucion:

1. Confirmar entorno y conexion destino; consultar en modo de solo lectura las migraciones aplicadas y el esquema. No leer ni mostrar .env sin necesidad explicitamente autorizada.
2. Verificar copia de seguridad y un plan de reversion aprobado; no reejecutar ni editar migraciones historicas compartidas que ya fueron aplicadas.
3. Revisar disponibilidades huerfanas antes de anadir la FK. Los registros creados con el antiguo identificador fijo requieren verificar propiedad: que el numero exista no demuestra que sea el profesional correcto. No reasignar automaticamente.
4. Revisar rangos invalidos y superposiciones bloqueantes existentes antes del CHECK y EXCLUDE. Si hay incompatibilidades, informar y decidir con el equipo; no borrar ni corregir datos automaticamente.
5. Confirmar disponibilidad y permisos de btree_gist. La restriccion debe estar aplicada antes de habilitar asignaciones; no sustituirla por bloqueos en memoria.
6. createdByUserId queda nullable para registros anteriores. No inventar su creador. Las fechas predeterminadas de auditoria en filas anteriores representan el momento de migracion, no su historia real. updatedAt automatico corresponde a escrituras TypeORM; SQL externo requiere gestion explicita.
7. Las reversiones automaticas de las dos migraciones de Turnos estan bloqueadas para proteger datos y restricciones. No usar revert ni ejecutar down sin un plan manual aprobado.
8. La migracion de pertenencia Paciente-Profesional y las FK definitivas de Turnos aun no estan resueltas. No derivar propietarios de datos enviados por clientes ni de relaciones terapeuticas incompletas.

Docker Compose publica PostgreSQL en el puerto local 5433 hacia 5432 del contenedor. El README contiene referencias a 5432 para el host; comprobar la configuracion autorizada sin asumir uno u otro puerto.

## 8. Verificaciones ya realizadas y sus limites

Resultados de la etapa anterior de integracion, no reejecutados en este cierre documental:

- npm.cmd run build: aprobado.
- TypeScript con tests: aprobado.
- Suite completa: 157 pruebas aprobadas, 7 de PostgreSQL omitidas; 15 suites aprobadas y una omitida.
- Resolver: profesional activo, ausente, dado de baja, id invalido y fallo de consulta.
- HTTP con modulos, servicios, resolver y guards reales; persistencia y reloj simulados, sin leer .env. Se verificaron identidad compartida y una consulta por solicitud, ausencia de acceso a agendas ajenas y bloqueo real del adaptador de pacientes.
- Regresion de consulta/asignacion, auditoria y metadatos verificada mediante pruebas.
- ESLint de archivos de integracion aprobado sin --fix. ESLint global sigue con 257 errores preexistentes: 242 de formato y 15 de tipado/imports. Se comprobo que pertenecen a archivos identicos al HEAD anterior o a origin/develop. No se homogeneizaron modulos ajenos para corregirlos.
- No se verifico arranque con PostgreSQL, estado de migraciones, filas antiguas ni concurrencia real. Las pruebas simuladas no demuestran exclusion concurrente en el motor real.

postgres-concurrency.spec.ts es optativa y requiere ARMONIA_BOOKING_TEST_URL hacia una base dedicada cuyo nombre empiece por armonia_appointments_test. Crea fixtures SQL en un esquema aleatorio; no usa la base de desarrollo. No ejecutarla sin autorizacion para esas pruebas. Durante la verificacion completa se deshabilito expresamente ese URL en el proceso para evitar modificaciones de base de datos.

En este cierre se revisaron nuevamente rama, MERGE_HEAD, indice, ausencia de conflictos, alcance de archivos y comprobaciones de whitespace. No se repitieron tests porque solo se actualizo este documento.

## 9. Comprobaciones manuales futuras

Solo con el esquema necesario aplicado y autorizacion para operar sobre el entorno:

- POST /auth/login: autenticar; GET /auth/me y GET /profesionales/me: identidad propia. No confundir idUsuario con idProfesional.
- POST /availabilities con profesional activo: 201. professionalId en el body: 400.
- GET /appointments/free-slots?date=YYYY-MM-DD: 200 con intervalos propios. professionalId adicional: 400.
- Agenda sin JWT: 401; rol incorrecto: 403; profesional ausente o dado de baja: 403.
- POST /appointments con profesional activo y solicitud valida/futura: 404 generico mientras el adaptador de pacientes permanezca cerrado, sin guardar turnos.
- No intentar 201 real ni concurrencia de asignacion hasta integrar pertenencia persistida y comprobar las migraciones.

## 10. Pendientes y siguiente paso permitido

- Revisar y confirmar el merge preparado; publicar la rama manualmente cuando el usuario lo decida.
- Coordinar la pertenencia Paciente-Profesional con su autor original y corregir su autorizacion, inyeccion y migraciones antes de integrarlo.
- Comprobar en modo de solo lectura el estado del esquema y datos; autorizar por separado cualquier migracion o correccion.
- Probar persistencia y concurrencia en un PostgreSQL de pruebas dedicado antes de habilitar asignacion real.
- Corregir lint global solo con un alcance acordado, sin reestructurar modulos ajenos.
- Cancelacion, reprogramacion, cobros, tarifas, comprobantes, recordatorios, WhatsApp, consentimiento informado e indicadores requieren desarrollo y/o definiciones adicionales.
- Historias clinicas y procesos terapeuticos no estan integrados en esta rama. No asumir sus cardinalidades o permisos a partir de prototipos de otras ramas.

Referencias complementarias: [ASIGNAR_TURNOS.md](ASIGNAR_TURNOS.md) y [INTEGRACION_PROFESIONALES.md](INTEGRACION_PROFESIONALES.md). Sus inventarios describen etapas anteriores; este documento resume el estado actual de continuidad.

## 11. Confirmar el merge y publicar, manualmente

Los siguientes comandos estan documentados para el usuario; Codex NO los ejecuto. Se deben usar solo tras revisar el contenido preparado y confirmar que la rama y el estado siguen siendo los descritos. No volver a ejecutar merge ni usar --amend: el commit normal finaliza el merge pendiente.

Desde PowerShell:

```powershell
Set-Location -LiteralPath 'D:\UTN\Seminario\armonia'
git branch --show-current
git status
git diff --name-only --diff-filter=U
git diff --cached --check
git diff --cached --stat
git add -- AGENTS.md docs/CONTEXTO_ARMONIA.md docs/ASIGNAR_TURNOS.md docs/INTEGRACION_PROFESIONALES.md
git diff --cached --check
git diff --cached --stat
git commit -m "merge: integrar profesionales y disponibilidades con turnos"
git push origin asignar-turno-sin-superposicion
git status --short --branch
```

La consulta de conflictos debe estar vacia y diff --check no debe informar errores. Los 35 archivos del backend ya estan preparados; git add incorpora instrucciones y documentos que hoy siguen sin seguimiento. El commit conserva los dos padres del merge. Si el remoto rechazo el push por nuevos cambios, no usar --force: revisar la divergencia antes de integrar nada mas.
