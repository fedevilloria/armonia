import { Test } from '@nestjs/testing';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
describe('UsuariosController', () => {
  it('delegates creation to the existing user service', async () => {
    const service = { crear: jest.fn().mockResolvedValue({ idUsuario: 7 }) };
    const module = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [{ provide: UsuariosService, useValue: service }],
    }).compile();
    const input = {
      nombre: 'Unit',
      apellido: 'Test',
      correoElectronico: 'unit@example.com',
      contrasena: 'unit-test-password',
      idRol: 1,
    };
    expect(await module.get(UsuariosController).crear(input)).toEqual({
      idUsuario: 7,
    });
    expect(service.crear).toHaveBeenCalledWith(input);
  });
});
