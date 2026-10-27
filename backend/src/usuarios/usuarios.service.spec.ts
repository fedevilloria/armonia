import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { UsuariosService } from './usuarios.service';
describe('UsuariosService', () => {
  const builder = {
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const users = { findOne: jest.fn(), createQueryBuilder: () => builder };
  const roles = {};
  let service: UsuariosService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: getRepositoryToken(Usuario), useValue: users },
        { provide: getRepositoryToken(Rol), useValue: roles },
      ],
    }).compile();
    service = module.get(UsuariosService);
  });
  beforeEach(() => jest.clearAllMocks());
  it('explicitly selects the password hash for login after select:false', async () => {
    builder.getOne.mockResolvedValue({ idUsuario: 7 });
    expect(await service.buscarPorCorreo('unit@example.com')).toEqual({
      idUsuario: 7,
    });
    expect(builder.addSelect).toHaveBeenCalledWith('usuario.contrasena');
    expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
      'usuario.rol',
      'rol',
    );
    expect(builder.where).toHaveBeenCalledWith(
      'usuario.correoElectronico = :correoElectronico',
      { correoElectronico: 'unit@example.com' },
    );
  });
  it('rejects duplicate email addresses before creating an account', async () => {
    users.findOne.mockResolvedValue({ idUsuario: 7 });
    await expect(
      service.crear({
        nombre: 'Unit',
        apellido: 'Test',
        correoElectronico: 'unit@example.com',
        contrasena: 'unit-test-password',
        idRol: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
