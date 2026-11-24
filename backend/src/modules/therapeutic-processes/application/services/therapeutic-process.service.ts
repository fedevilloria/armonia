import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';

import { Repository, EntityManager } from 'typeorm';

import { TherapeuticProcessOrmEntity } from '../../infrastructure/persistence/therapeutic-process.orm-entity';
import { CreateTherapeuticProcessDto } from '../dto/create-therapeutic-process.dto';
import { ChangeTherapeuticProcessStateDto } from '../dto/change-therapeutic-process-state.dto';
import { PatientOrmEntity } from '../../../patients/infrastructure/persistence/patient.orm-entity';

@Injectable()
export class TherapeuticProcessService {
  constructor(
    @InjectRepository(TherapeuticProcessOrmEntity)
    private readonly processRepository: Repository<TherapeuticProcessOrmEntity>,

    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  // Crear un nuevo proceso terapéutico
  async create(
    dto: CreateTherapeuticProcessDto,
    idProfesional: number,
  ): Promise<TherapeuticProcessOrmEntity> {
    // 1. Verificar que el paciente exista
    const paciente = await this.entityManager.findOne(PatientOrmEntity, {
      where: {
        idPaciente: dto.idPaciente,
      },
    });

    if (!paciente) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // 2. Verificar si pertenece a otro profesional
    const procesoDeOtroProfesional = await this.processRepository
      .createQueryBuilder('proceso')
      .where('proceso.idPaciente = :idPaciente', {
        idPaciente: dto.idPaciente,
      })
      .andWhere('proceso.idProfesional != :idProfesional', {
        idProfesional,
      })
      .getOne();

    if (procesoDeOtroProfesional) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // 3. Verificar que no tenga un proceso activo
    const procesoActivo = await this.processRepository.findOne({
      where: {
        paciente: {
          idPaciente: dto.idPaciente,
        },
        idEstadoProcesoTerapeutico: 1,
      },
    });

    if (procesoActivo) {
      throw new BadRequestException(
        'El paciente ya tiene un proceso terapéutico activo.',
      );
    }

    // 4. Crear el proceso terapéutico
    const nuevoProceso = this.processRepository.create({
      idProfesional,
      paciente: {
        idPaciente: dto.idPaciente,
      },
      idEstadoProcesoTerapeutico: 1,
      fechaInicio: new Date(),
      observaciones: dto.observaciones,
    });

    // 5. Guardar y devolver
    return await this.processRepository.save(nuevoProceso);
  }

  // Cambiar el estado de un proceso terapéutico
  async changeState(
    idProcesoTerapeutico: number,
    dto: ChangeTherapeuticProcessStateDto,
    idProfesional: number,
  ): Promise<TherapeuticProcessOrmEntity> {
    // 1. Verificar que el proceso exista
    const proceso = await this.processRepository.findOne({
      where: { idProcesoTerapeutico, idProfesional },
    });

    if (!proceso) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // 3. Verificar que esté activo
    if (proceso.idEstadoProcesoTerapeutico !== 1) {
      throw new BadRequestException(
        'Solo se puede cambiar el estado de un proceso terapéutico activo.',
      );
    }

    // 4. Actualizar únicamente si continúa activo
    const resultado = await this.processRepository
      .createQueryBuilder()
      .update(TherapeuticProcessOrmEntity)
      .set({
        idEstadoProcesoTerapeutico: dto.idEstadoProcesoTerapeutico,
        fechaFinalizacion: new Date(),
        motivoFinalizacion: dto.motivoFinalizacion ?? '',
      })
      .where('idProcesoTerapeutico = :idProcesoTerapeutico', {
        idProcesoTerapeutico,
      })
      .andWhere('idProfesional = :idProfesional', {
        idProfesional,
      })
      .andWhere('idEstadoProcesoTerapeutico = :estadoActivo', {
        estadoActivo: 1,
      })
      .execute();

    // 5. Verificar que la actualización se haya realizado
    if (resultado.affected !== 1) {
      throw new BadRequestException(
        'El proceso terapéutico ya no se encuentra activo.',
      );
    }

    // 6. Recuperar el proceso actualizado
    const procesoActualizado = await this.processRepository.findOne({
      where: { idProcesoTerapeutico, idProfesional },
    });

    if (!procesoActualizado) {
      throw new NotFoundException('Recurso no encontrado');
    }

    return procesoActualizado;
  }
}
