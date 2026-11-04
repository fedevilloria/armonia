# Pruebas funcionales manuales - Armonia

## 1. Objetivo

Registrar los resultados de la primera ronda de pruebas manuales del backend de Armonia realizadas mediante Postman. El flujo cubierto comprende autenticacion, identidad, registro de especialidad y profesional, registro de disponibilidades y consulta de horarios libres.

## 2. Entorno y procedencia de los resultados

- Rama de trabajo: `asignar-turno-sin-superposicion`.
- Backend: NestJS y TypeORM; URL local de referencia: `http://localhost:3000`.
- Base local: PostgreSQL 18.3 de Windows, `localhost:5432`, base `armonia`, esquema `public`.
- Las nueve migraciones fueron aplicadas previamente, segun el contexto de preparacion del entorno. Se mantiene `synchronize: false`.
- Herramienta de ejecucion: Postman, con solicitudes ejecutadas manualmente por el usuario.
- Fuente de este registro: resultados observados e informados por el usuario. Para elaborar este documento no se repitieron solicitudes ni se inspecciono PostgreSQL.
- No se dispone de una fecha exacta de ejecucion registrada. Las fechas de noviembre de 2026 que aparecen mas adelante son datos de prueba, no fechas de ejecucion.
- No se adjuntan capturas, logs ni exportaciones como evidencia adicional. Se omiten contrasenas, valores de JWT y credenciales.

## 3. Alcance y datos de referencia

Los identificadores observados corresponden exclusivamente al entorno de prueba y no son valores fijos de la aplicacion:

| Recurso | Valor observado |
|---|---|
| Usuario administrador | `sub=1`, rol `ADMINISTRADOR` |
| Especialidad registrada | `idEspecialidad=1` |
| Usuario profesional | `idUsuario=2`, `sub=2`, rol `PROFESIONAL` |
| Profesional asociado | `idProfesional=1` |
| Disponibilidad | Lunes, de 09:00 a 10:40 |
| Duracion | 30 minutos por turno |
| Vigencia | Del 2026-11-01 al 2026-11-30, inclusive |

`JWT.sub` identifica al usuario; no equivale a `idProfesional`. En las operaciones de agenda, el backend resuelve al profesional desde la relacion persistida. Los casos de seguridad verifican rechazos de identificadores enviados por el cliente, ausencia de JWT y rol incorrecto.

## 4. Criterio de evaluacion

Cada caso registra endpoint, escenario, resultado esperado, resultado observado y estado. **Aprobado** significa que el resultado observado informado coincide con el esperado. Un rechazo previsto con HTTP 400, 401 o 403 constituye una prueba aprobada, no un fallo de la ronda.

Se conservan identificadores correlativos PF-01 a PF-23 segun el orden informado, aunque los casos se agrupan por tipo.

## 5. Pruebas funcionales exitosas

| ID | Endpoint | Escenario | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|
| PF-01 | `POST /auth/login` | Login del administrador | 201 y generacion de JWT | 201; JWT generado, valor omitido | Aprobado |
| PF-02 | `GET /auth/me` | Consultar identidad del administrador | 200; identidad administrativa autenticada | 200; sub=1, rol ADMINISTRADOR | Aprobado |
| PF-03 | `POST /especialidades` | Registrar una especialidad con permisos administrativos | 201; especialidad creada | 201; idEspecialidad=1 | Aprobado |
| PF-04 | `POST /profesionales` | Registrar conjuntamente Usuario y Profesional | 201; profesional asociado a un usuario con rol PROFESIONAL | 201; idProfesional=1, idUsuario=2, rol PROFESIONAL | Aprobado |
| PF-05 | `POST /auth/login` | Login del profesional | 201 y generacion de JWT | 201; JWT generado, valor omitido | Aprobado |
| PF-06 | `GET /auth/me` | Consultar identidad del profesional | 200; identidad profesional autenticada | 200; sub=2, rol PROFESIONAL | Aprobado |
| PF-07 | `GET /profesionales/me` | Consultar el perfil profesional propio | 200; profesional asociado al usuario autenticado | 200; idProfesional=1 | Aprobado |
| PF-08 | `POST /availabilities` | Registrar lunes de 09:00 a 10:40, duration=30, vigencia 2026-11-01 a 2026-11-30 | 201; disponibilidad registrada | 201; disponibilidad registrada con los parametros indicados | Aprobado |
| PF-09 | `GET /appointments/free-slots?date=2026-11-09` | Consultar un lunes incluido en la vigencia | 200; tres intervalos completos de 30 minutos | 200; tres horarios de 30 minutos | Aprobado |
| PF-18 | `GET /appointments/free-slots?date=2026-11-10` | Consultar un martes sin disponibilidad | 200; slots vacio | 200; slots vacio | Aprobado |
| PF-19 | `GET /appointments/free-slots?date=2026-11-30` | Consultar el ultimo dia de vigencia, lunes | 200; tres horarios por vigencia inclusiva | 200; tres horarios | Aprobado |
| PF-20 | `GET /appointments/free-slots?date=2026-12-07` | Consultar un lunes posterior a la vigencia | 200; slots vacio | 200; slots vacio | Aprobado |

Para el bloque de referencia, el calculo esperado produce 09:00-09:30, 09:30-10:00 y 10:00-10:30. Los diez minutos finales no alcanzan para otro turno y se descartan. El resultado informado confirma tres horarios de 30 minutos; esta descripcion del calculo no representa una captura ni una transcripcion adicional de la respuesta.

## 6. Pruebas negativas de validacion y reglas de negocio

| ID | Endpoint | Escenario | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|
| PF-10 | `POST /availabilities` | Intentar registrar una disponibilidad superpuesta | 400; rechazo del bloque | 400; rechazo correcto | Aprobado |
| PF-11 | `POST /availabilities` | Enviar duration=0 | 400; rechazo por duracion invalida | 400; rechazo correcto | Aprobado |
| PF-12 | `POST /availabilities` | Enviar hora 25:00 | 400; rechazo por hora invalida | 400; rechazo correcto | Aprobado |
| PF-13 | `POST /availabilities` | Enviar vigencia invertida | 400; rechazo del rango de fechas | 400; rechazo correcto | Aprobado |
| PF-17 | `GET /appointments/free-slots?date=2026-02-30` | Consultar una fecha inexistente | 400; rechazo de la fecha | 400; rechazo correcto | Aprobado |

No se registraron los valores completos de los cuerpos de los casos negativos. No se reconstruyen como si fueran solicitudes efectivamente conservadas.

## 7. Pruebas de seguridad

| ID | Endpoint | Escenario | Resultado esperado | Resultado observado | Estado |
|---|---|---|---|---|---|
| PF-14 | `POST /availabilities` | Enviar professionalId arbitrario en el cuerpo | 400; no aceptar el propietario enviado ni crear registros | 400; rechazo correcto, sin crear registros | Aprobado |
| PF-15 | `POST /availabilities` | Enviar solicitud sin JWT | 401; autenticacion requerida | 401 | Aprobado |
| PF-16 | `POST /availabilities` | Usar usuario con rol ADMINISTRADOR | 403; operacion restringida al rol PROFESIONAL | 403 | Aprobado |
| PF-21 | `GET /appointments/free-slots` | Agregar professionalId arbitrario a la consulta | 400; rechazar el identificador adicional | 400 | Aprobado |
| PF-22 | `GET /appointments/free-slots` | Enviar solicitud sin JWT | 401; autenticacion requerida | 401 | Aprobado |
| PF-23 | `GET /appointments/free-slots` | Usar usuario con rol ADMINISTRADOR | 403; operacion restringida al rol PROFESIONAL | 403 | Aprobado |

No se registraron los valores de professionalId arbitrarios ni el conjunto completo de parametros de PF-21. No se incluyen tokens utilizados durante las pruebas.

## 8. Resumen de resultados

| Categoria | Casos | Aprobados |
|---|---:|---:|
| Funcionales exitosos | 12 | 12 |
| Negativos de validacion y negocio | 5 | 5 |
| Seguridad | 6 | 6 |
| Total | 23 | 23 |

Todas las solicitudes informadas devolvieron los codigos HTTP esperados. Esta conclusion se limita a los escenarios y resultados consignados; no acredita cobertura completa del sistema.

## 9. Limitaciones y pruebas pendientes

- Este registro corresponde a pruebas manuales de Postman. No acredita ejecucion de pruebas automatizadas desde Postman, pruebas de carga ni concurrencia real.
- La autorizacion persistida de pertenencia Paciente-Profesional continua pendiente de integracion. No basta comprobar que un paciente exista.
- `POST /appointments` debe permanecer bloqueado por esa autorizacion pendiente. Esta ronda no acredita asignaciones exitosas ni habilita temporalmente el endpoint.
- Quedan pendientes las pruebas funcionales de asignacion de turnos, autorizacion de pacientes propios y ajenos, y exclusion de horarios ocupados mediante turnos persistidos.
- Queda pendiente comprobar solicitudes simultaneas con conexiones reales a PostgreSQL en una base de pruebas dedicada. El rechazo observado de bloques de disponibilidad superpuestos no demuestra proteccion concurrente de reservas de turnos.
- Esta ronda no incluye una prueba de aislamiento entre dos profesionales distintos ni escenarios de profesional dado de baja o JWT expirado.
- No se ejecutaron nuevas migraciones, solicitudes o modificaciones de PostgreSQL para redactar este documento.
