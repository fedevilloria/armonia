import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
describe('AuthController', () => {
  it('delegates login to the authentication service', async () => {
    const service = {
      login: jest.fn().mockResolvedValue({ access_token: 'unit-test-token' }),
    };
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();
    const controller = module.get(AuthController);
    const input = {
      correoElectronico: 'unit@example.com',
      contrasena: 'unit-test-password',
    };
    expect(await controller.login(input)).toEqual({
      access_token: 'unit-test-token',
    });
    expect(service.login).toHaveBeenCalledWith(input);
  });
  it('returns the authenticated identity without additional user fields', () => {
    const controller = new AuthController({} as AuthService);
    expect(
      controller.obtenerUsuarioActual({ sub: 7, rol: 'PROFESIONAL' }),
    ).toEqual({ sub: 7, rol: 'PROFESIONAL' });
  });
});
