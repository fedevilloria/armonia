import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async crear(createUsuarioDto: CreateUsuarioDto) {
    const usuarioExistente = await this.usuarioRepository.findOne({
      where: {
        correoElectronico: createUsuarioDto.correoElectronico,
      },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        'Ya existe un usuario registrado con ese correo electrónico',
      );
    }

    const rol = await this.rolRepository.findOne({
      where: {
        idRol: createUsuarioDto.idRol,
      },
    });

    if (!rol) {
      throw new BadRequestException('El rol indicado no existe');
    }

    const contrasenaHash = await bcrypt.hash(
      createUsuarioDto.contrasena,
      10,
    );

    const usuario = this.usuarioRepository.create({
      nombre: createUsuarioDto.nombre,
      apellido: createUsuarioDto.apellido,
      correoElectronico: createUsuarioDto.correoElectronico,
      contrasena: contrasenaHash,
      rol,
    });

    const usuarioGuardado = await this.usuarioRepository.save(usuario);

    const { contrasena, ...usuarioSinContrasena } = usuarioGuardado;

    return usuarioSinContrasena;
  }
  async buscarPorCorreo(correoElectronico: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: {
        correoElectronico,
      },
      relations: {
        rol: true,
    },
  });
}
}