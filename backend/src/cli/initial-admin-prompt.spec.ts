import { PassThrough } from 'node:stream';
import { readSecret } from './initial-admin-prompt';

function terminal() {
  const input = Object.assign(new PassThrough(), {
    isTTY: true,
    isRaw: false,
    setRawMode: jest.fn(),
  });
  const output = Object.assign(new PassThrough(), { isTTY: true });
  let visible = '';
  output.on('data', (chunk: Buffer) => {
    visible += chunk.toString();
  });
  return {
    input,
    output,
    visible: () => visible,
    read: () =>
      readSecret(
        'Clave: ',
        input as unknown as NodeJS.ReadStream,
        output as unknown as NodeJS.WriteStream,
      ),
  };
}
describe('Hidden password prompt', () => {
  it('never echoes typed characters and restores terminal mode', async () => {
    const t = terminal();
    const pending = t.read();
    t.input.emit('keypress', 'secret', {});
    t.input.emit('keypress', undefined, { name: 'backspace' });
    t.input.emit('keypress', 'X', {});
    t.input.emit('keypress', undefined, { name: 'return' });
    expect(await pending).toBe('secreX');
    expect(t.visible()).toBe('Clave: \n');
    expect(t.input.setRawMode).toHaveBeenLastCalledWith(false);
    expect(t.input.listenerCount('keypress')).toBe(0);
  });
  it('cancels without returning a secret and restores terminal mode', async () => {
    const t = terminal();
    const pending = t.read();
    t.input.emit('keypress', 'secret', {});
    t.input.emit('keypress', undefined, { name: 'c', ctrl: true });
    await expect(pending).rejects.toThrow('cancelada');
    expect(t.visible()).not.toContain('secret');
    expect(t.input.setRawMode).toHaveBeenLastCalledWith(false);
  });
  it('refuses redirected input', async () => {
    const t = terminal();
    t.input.isTTY = false;
    await expect(t.read()).rejects.toThrow('terminal interactiva');
  });
});
