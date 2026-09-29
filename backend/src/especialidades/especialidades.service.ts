import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Especialidad } from './entities/especialidad.entity';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dto/update-especialidad.dto';

@Injectable()
export class EspecialidadesService {
  constructor(
    @InjectRepository(Especialidad)
    private readonly especialidadesRepository: Repository<Especialidad>,
  ) {}

  async crear(
    createEspecialidadDto: CreateEspecialidadDto,
  ): Promise<Especialidad> {
    const existente =
      await this.especialidadesRepository.findOne({
        where: {
          nombre: createEspecialidadDto.nombre,
        },
      });

    if (existente) {
      throw new ConflictException(
        'Ya existe una especialidad con ese nombre',
      );
    }

    const especialidad =
      this.especialidadesRepository.create({
        ...createEspecialidadDto,
        fechaBaja: null,
      });

    return this.especialidadesRepository.save(especialidad);
  }

  async listarActivas(): Promise<Especialidad[]> {
    return this.especialidadesRepository.find({
      where: {
        fechaBaja: IsNull(),
      },
      order: {
        nombre: 'ASC',
      },
    });
  }

  async buscarPorId(
    idEspecialidad: number,
  ): Promise<Especialidad> {
    const especialidad =
      await this.especialidadesRepository.findOne({
        where: {
          idEspecialidad,
          fechaBaja: IsNull(),
        },
      });

    if (!especialidad) {
      throw new NotFoundException(
        'Especialidad no encontrada',
      );
    }

    return especialidad;
  }

  async modificar(
    idEspecialidad: number,
    updateEspecialidadDto: UpdateEspecialidadDto,
  ): Promise<Especialidad> {
    const especialidad = await this.buscarPorId(idEspecialidad);

    if (
      updateEspecialidadDto.nombre &&
      updateEspecialidadDto.nombre !== especialidad.nombre
    ) {
      const existente = await this.especialidadesRepository.findOne({
        where: {
          nombre: updateEspecialidadDto.nombre,
        },
      });

      if (existente) {
        throw new ConflictException(
          'Ya existe una especialidad con ese nombre',
        );
      }
    }

    Object.assign(especialidad, updateEspecialidadDto);

    return this.especialidadesRepository.save(especialidad);
  }
  async darDeBaja(
    idEspecialidad: number,
  ): Promise<Especialidad> {
    const especialidad = await this.buscarPorId(idEspecialidad);

    especialidad.fechaBaja = new Date();

    return this.especialidadesRepository.save(especialidad);
  }
}