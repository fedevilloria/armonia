import { createInterface } from 'node:readline/promises';
import { readSecret } from './initial-admin-prompt';
import { AppDataSource } from '../data-source';
import {
  InitialAdminError,
  initializeFirstAdmin,
} from './initial-admin.service';

export async function main(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new InitialAdminError(
      'Ejecute el comando en una terminal interactiva, sin redirecciones.',
    );
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let firstName: string;
  let lastName: string;
  let email: string;
  try {
    firstName = await prompt.question('Nombre: ');
    lastName = await prompt.question('Apellido: ');
    email = await prompt.question('Correo electrónico: ');
  } finally {
    prompt.close();
  }
  let password = await readSecret('Contraseña (oculta): ');
  try {
    let confirmation = await readSecret('Repita la contraseña (oculta): ');
    const matches = password === confirmation;
    confirmation = '';
    if (!matches) throw new InitialAdminError('Las contraseñas no coinciden.');
    // No iniciar NestJS ni instalar extensiones al conectar el comando.
    AppDataSource.setOptions({
      logging: false,
      installExtensions: false,
      extra: {
        connectionTimeoutMillis: 5000,
        options: '-c lock_timeout=10000 -c statement_timeout=30000',
      },
    });
    await initializeFirstAdmin(AppDataSource, {
      firstName,
      lastName,
      email,
      password,
    });
    process.stdout.write('Administrador inicial creado correctamente.\n');
  } finally {
    password = '';
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    process.stderr.write(
      (error instanceof InitialAdminError
        ? error.message
        : 'No se pudo completar la inicialización.') + '\n',
    );
    process.exitCode = 1;
  });
}
