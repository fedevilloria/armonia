import { emitKeypressEvents } from 'node:readline';
import { InitialAdminError } from './initial-admin.service';

export async function readSecret(
  label: string,
  input: NodeJS.ReadStream = process.stdin,
  output: NodeJS.WriteStream = process.stdout,
): Promise<string> {
  if (!input.isTTY || !output.isTTY)
    throw new InitialAdminError(
      'Se requiere una terminal interactiva para proteger la contraseña.',
    );
  output.write(label);
  emitKeypressEvents(input);
  const previousRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let secret = '';
    const finish = (error?: Error) => {
      input.removeListener('keypress', onKey);
      input.setRawMode(previousRaw);
      input.pause();
      output.write('\n');
      const result = secret;
      secret = '';
      if (error) reject(error);
      else resolve(result);
    };
    const onKey = (
      value: string | undefined,
      key: { name?: string; ctrl?: boolean; meta?: boolean },
    ) => {
      if (key.ctrl && ['c', 'd'].includes(key.name ?? ''))
        return finish(new InitialAdminError('Inicialización cancelada.'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') {
        secret = Array.from(secret).slice(0, -1).join('');
        return;
      }
      if (
        value &&
        !key.ctrl &&
        !key.meta &&
        !Array.from(value).some(
          (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
        )
      ) {
        if (secret.length + value.length > 4096)
          return finish(new InitialAdminError('Contraseña demasiado larga.'));
        secret += value;
      }
    };
    input.on('keypress', onKey);
  });
}
