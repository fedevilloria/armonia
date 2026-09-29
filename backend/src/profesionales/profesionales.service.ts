import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Profesional } from './entities/profesional.entity';

@Injectable()
export class ProfesionalesService {
  constructor(
    @InjectRepository(Profesional)
    private readonly profesionalesRepository: Repository<Profesional>,
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
}