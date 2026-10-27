# Instrucciones para agentes de desarrollo — Armonía

## Propósito
Este archivo rige el trabajo de Codex dentro del repositorio Armonía. Antes de modificar código, leer `docs/CONTEXTO_ARMONIA.md` y contrastarlo con el código actual. Las decisiones funcionales documentadas son requisitos acordados, **no prueba de que estén implementadas**.

## Stack y arquitectura
- Backend: NestJS 11, TypeORM, PostgreSQL; monolito modular.
- Frontend: Angular 19 standalone, Angular Material; Tailwind está configurado según la auditoría.
- Seguridad: JWT y autorización por roles; proteger el acceso a datos por profesional.
- Para nuevos módulos de backend, tomar `availabilities` como referencia de integración completa y `appointments` como referencia de contratos de repositorio y mapeos, **sin copiar sus defectos detectados**.
- Mantener, cuando corresponda, las capas `domain`, `application`, `infrastructure`, `presentation` y el archivo `<feature>.module.ts`.
- El dominio no debe depender de NestJS ni TypeORM. Los controladores deben delegar en casos de uso. La persistencia debe implementar contratos de dominio.
- Respetar convenciones reales del repositorio; antes de homogeneizar nomenclatura o estructura, solicitar aprobación. Para nuevas carpetas de persistencia, usar `persistence` (no `persistance`).

## Forma de trabajo
1. Leer el contexto funcional y explorar los archivos relevantes antes de proponer cambios.
2. Distinguir hechos verificados en el código de decisiones documentadas y propuestas.
3. Explicar brevemente el plan, archivos afectados y supuestos antes de cambios amplios.
4. Para decisiones ambiguas de negocio, identidad, autorización, estados, cobros o datos clínicos, preguntar antes de implementar.
5. Implementar cambios acotados y coherentes con los patrones existentes; no reestructurar módulos ajenos sin permiso.
6. Ejecutar, cuando sea posible, verificaciones relevantes (`build`, tests, lint sin `--fix` automático). Informar resultados reales y lo que no pudo verificarse.
7. Resumir cambios, riesgos, migraciones requeridas y pasos manuales. No afirmar que algo funciona sin haberlo probado.

## Seguridad y datos
- Un profesional no puede acceder a pacientes, historias, turnos o información clínica de otro profesional salvo una autorización explícita y justificada por rol/regla de negocio.
- No asumir que el identificador del usuario JWT equivale al identificador del profesional; comprobar el modelo de identidad.
- Validar propiedad de recursos en backend, no solo en frontend ni únicamente por rol.
- No exponer secretos, contraseñas, tokens ni datos clínicos en logs, respuestas o ejemplos.
- Nunca leer o mostrar el contenido de `.env` salvo necesidad explícita autorizada; no copiarlo a documentación.
- No ejecutar migraciones destructivas, borrar datos, modificar secretos, instalar dependencias nuevas, desplegar o hacer `git push` sin aprobación expresa.
- Mantener `synchronize: false` y migraciones versionadas para cambios de esquema.
- En turnos, considerar conflictos de horario y concurrencia a nivel de base de datos/transacción; no confiar solo en una consulta previa.

## Hallazgos de la auditoría (pendientes de validar/corregir)
- `appointments` aún no tiene módulo Nest, controlador, DTO, caso de uso ni migración; no está registrado en `AppModule`.
- En `appointments` hay una discrepancia `persistence`/`persistance` en un import.
- El registro de entidades ORM para migraciones debe revisarse; `AppointmentOrmEntity` podría no ser descubierto.
- La creación de disponibilidades usa un `professionalId` fijo y requiere revisar autorización y propiedad.
- Existen diferencias de tratamiento de fechas y posibles carreras por superposición de horarios.
- El frontend todavía carece de funcionalidades de negocio implementadas, según la auditoría estática.
Estos hallazgos provienen de una revisión de solo lectura; verificar su vigencia antes de actuar.

## Prioridades al desarrollar funcionalidades nuevas
1. Integridad y seguridad de datos.
2. Reglas de negocio y contratos de API consistentes.
3. Separación de capas e inyección de dependencias.
4. Migraciones y pruebas de casos de uso.
5. Integración frontend/backend y experiencia de usuario.

## Regla de continuidad
Cuando el usuario pida «hacer otro módulo igual», inspeccionar primero el módulo de referencia real, explicar qué patrón se replicará y conservar convenciones existentes. No crear microservicios independientes: Armonía se definió como monolito modular. Ante contradicciones entre este archivo, el documento de contexto y el código, señalar la diferencia y pedir decisión en lugar de asumir.
