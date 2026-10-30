# Inicializacion manual del primer administrador

El comando no se ejecuta al iniciar NestJS, no expone endpoints y no modifica guards.

Desde una terminal interactiva de PowerShell:

```powershell
Set-Location -LiteralPath 'D:\UTN\Seminario\armonia\backend'
npm.cmd run admin:init
```

Solicita nombre, apellido, correo, contrasena y confirmacion. La contrasena no tiene eco; no pasar credenciales como argumentos ni mediante redirecciones. Debe cumplir el DTO existente: minimo 8 caracteres. Se rechazan mas de 72 bytes UTF-8 para evitar truncamiento de bcrypt.

Utiliza las variables DB_* ya configuradas, sin mostrar credenciales. Solo admite localhost:5432, base armonia, esquema public y servidor PostgreSQL 18.3 con direccion loopback. Rechaza sincronizacion, migraciones automaticas y recreacion de esquema. La conexion del comando deshabilita logging e instalacion automatica de extensiones. No inicia AppModule ni ejecuta migraciones.

Busca el rol ADMINISTRADOR persistido. En una transaccion READ COMMITTED, bloquea roles en SHARE y usuarios en SHARE ROW EXCLUSIVE, comprueba que no exista un administrador y reutiliza UsuariosService.crear con repositorios de esa misma transaccion. Esto conserva bcrypt y las reglas de correo/rol. Las inicializaciones simultaneas se serializan; otras escrituras de usuarios esperan. El bloqueo se libera al confirmar o revertir. Los bloqueos tienen limite de espera de 10 segundos y las consultas de 30 segundos.

Si ya existe un administrador, el rol falta, los datos son invalidos, las contrasenas no coinciden o falla la conexion, termina con codigo no cero y un mensaje sanitizado. No cambia roles de usuarios existentes ni intenta reparar datos. Si perdio acceso a una cuenta administradora, este comando no es un mecanismo de recuperacion.

El comando no esta ejecutado como parte de su implementacion. Las pruebas utilizan repositorios y conexiones simulados; la concurrencia real queda pendiente de una base de pruebas dedicada. No ejecutar estas pruebas con escrituras contra armonia.

Tras el alta manual, iniciar el backend y usar POST http://localhost:3000/auth/login con correoElectronico y contrasena. La respuesta esperada es 201 con access_token. Con Bearer Token, GET http://localhost:3000/auth/me debe devolver sub del usuario y rol ADMINISTRADOR. No registrar el token ni incluirlo en archivos compartidos. Luego crear especialidad y profesional con los endpoints protegidos existentes.

POST /appointments sigue cerrado por autorizacion pendiente de pertenencia Paciente-Profesional.
