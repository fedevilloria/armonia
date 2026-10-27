import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
describe('AuthService', () => {
  const users = { buscarPorCorreo: jest.fn() };
  const jwt = { signAsync: jest.fn() };
  let service: AuthService;
  let passwordHash: string;
  beforeAll(async () => {
    passwordHash = await bcrypt.hash('unit-test-password', 4);
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });
  beforeEach(() => {
    jest.clearAllMocks();
    users.buscarPorCorreo.mockResolvedValue({
      idUsuario: 7,
      contrasena: passwordHash,
      rol: { nombre: 'PROFESIONAL' },
    });
    jwt.signAsync.mockResolvedValue('unit-test-token');
  });
  it('keeps sub as the user id and does not include credentials in the response', async () => {
    expect(
      await service.login({
        correoElectronico: 'unit@example.com',
        contrasena: 'unit-test-password',
      }),
    ).toEqual({ access_token: 'unit-test-token' });
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 7, rol: 'PROFESIONAL' });
  });
  it('rejects an unknown account', async () => {
    users.buscarPorCorreo.mockResolvedValue(null);
    await expect(
      service.login({
        correoElectronico: 'unit@example.com',
        contrasena: 'unit-test-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
  it('rejects an incorrect password', async () => {
    await expect(
      service.login({
        correoElectronico: 'unit@example.com',
        contrasena: 'incorrect-unit-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });
});
