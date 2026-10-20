import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Profesional } from './entities/profesional.entity';
import { TipoDocumento } from './entities/tipo-documento.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Rol } from '../usuarios/entities/rol.entity';
import { Especialidad } from '../especialidades/entities/especialidad.entity';

import { CreateProfesionalDto } from './dto/create-profesional.dto';

@Injectable()
export class ProfesionalesService {
  constructor(
    @InjectRepository(Profesional)
    private readonly profesionalesRepository: Repository<Profesional>,

    @InjectRepository(TipoDocumento)
    private readonly tiposDocumentoRepository: Repository<TipoDocumento>,

    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,

    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,

    @InjectRepository(Especialidad)
    private readonly especialidadesRepository: Repository<Especialidad>,

    private readonly dataSource: DataSource,
  ) {}

  async buscarPorUsuario(
    idUsuario: number,
  ): Promise<Profesional> {
    const profesional =
      await this.profesionalesRepository.findOne({
        where: {
          usuario: {
            idUsuario,
          },
        },
        relations: {
          usuario: true,
          tipoDocumento: true,
          especialidad: true,
        },
      });

    if (!profesional) {
      throw new NotFoundException(
        'No se encontró un profesional asociado al usuario autenticado',
      );
    }

    return profesional;
  }

  async crear(
    dto: CreateProfesionalDto,
  ): Promise<Profesional> {
    // 1. Validar correo

    const usuarioExistente =
      await this.usuariosRepository.findOne({
        where: {
          correoElectronico: dto.correoElectronico,
        },
      });

    if (usuarioExistente) {
      throw new ConflictException(
        'Ya existe un usuario con ese correo electrónico',
      );
    }

    // 2. Validar DNI

    const profesionalConDni =
      await this.profesionalesRepository.findOne({
        where: {
          nroDNI: dto.nroDNI,
        },
      });

    if (profesionalConDni) {
      throw new ConflictException(
        'Ya existe un profesional con ese número de documento',
      );
    }

    // 3. Validar matrícula

    const profesionalConMatricula =
      await this.profesionalesRepository.findOne({
        where: {
          matricula: dto.matricula,
        },
      });

    if (profesionalConMatricula) {
      throw new ConflictException(
        'Ya existe un profesional con esa matrícula',
      );
    }

    // 4. Buscar tipo de documento

    const tipoDocumento =
      await this.tiposDocumentoRepository.findOneBy({
        idTipoDocumento: dto.idTipoDocumento,
      });

    if (!tipoDocumento) {
      throw new NotFoundException(
        'Tipo de documento no encontrado',
      );
    }

    // 5. Buscar especialidad activa

    const especialidad =
      await this.especialidadesRepository.findOne({
        where: {
          idEspecialidad: dto.idEspecialidad,
          fechaBaja: IsNull(),
        },
      });

    if (!especialidad) {
      throw new NotFoundException(
        'Especialidad no encontrada o dada de baja',
      );
    }

    // 6. Buscar rol PROFESIONAL

    const rolProfesional =
      await this.rolesRepository.findOne({
        where: {
          nombre: 'PROFESIONAL',
        },
      });

    if (!rolProfesional) {
      throw new NotFoundException(
        'No se encontró el rol PROFESIONAL',
      );
    }

    // 7. Hashear contraseña

    const contrasenaHash = await bcrypt.hash(
      dto.contrasena,
      10,
    );

    // 8. Crear Usuario + Profesional en una transacción

    return this.dataSource.transaction(
      async (manager) => {
        const usuario = manager.create(Usuario, {
          nombre: dto.nombre,
          apellido: dto.apellido,
          correoElectronico: dto.correoElectronico,
          contrasena: contrasenaHash,
          rol: rolProfesional,
        });

        const usuarioGuardado = await manager.save(
          Usuario,
          usuario,
        );

        const profesional = manager.create(Profesional, {
          nroDNI: dto.nroDNI,
          matricula: dto.matricula,
          telefono: dto.telefono,
          descripcionProfesional:
            dto.descripcionProfesional,
          fechaBaja: null,

          usuario: usuarioGuardado,
          tipoDocumento,
          especialidad,
        });

        return manager.save(
          Profesional,
          profesional,
        );
      },
    );
  }
}