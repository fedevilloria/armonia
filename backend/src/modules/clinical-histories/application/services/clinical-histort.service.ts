import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalHistoryOrmEntity } from '../../infrastructure/persistence/clinical-history.orm-entity';
import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { CreateClinicalHistoryDto } from '../dto/create-clinical-history.dto';

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @InjectRepository(ClinicalHistoryOrmEntity)
    private readonly clinicalHistoryRepository: Repository<ClinicalHistoryOrmEntity>,
    @InjectRepository(TherapeuticProcessOrmEntity)
    private readonly therapeuticProcessRepository: Repository<TherapeuticProcessOrmEntity>,
  ) {}

  async create(dto: CreateClinicalHistoryDto, profesionalIdLogueado: number): Promise<ClinicalHistoryOrmEntity> {
    const proceso = await this.therapeuticProcessRepository.findOne({
      where: { idProcesoTerapeutico: dto.idProcesoTerapeutico },
    });

    if (!proceso) {
      throw new NotFoundException('El proceso terapéutico especificado no existe.');
    }

    if (proceso.idProfesional !== profesionalIdLogueado) {
      throw new ForbiddenException('No tienes permisos para acceder o modificar información clínica de pacientes ajenos.');
    }

    // Validación de estado Activo (1 = Activo)
    if (proceso.idEstadoProcesoTerapeutico !== 1) {
      throw new BadRequestException(
        'No se puede agregar información a la historia clínica porque el proceso terapéutico no se encuentra activo. Primero debe cambiar su estado a Activo.'
      );
    }

    const nuevaHistoria = this.clinicalHistoryRepository.create(dto);
    return await this.clinicalHistoryRepository.save(nuevaHistoria);
  }

  async update(
    idHistoriaClinica: number,
    updateData: Partial<CreateClinicalHistoryDto>,
    profesionalIdLogueado: number,
  ): Promise<ClinicalHistoryOrmEntity> {
    const historia = await this.clinicalHistoryRepository.findOne({
      where: { idHistoriaClinica },
      relations: ['procesoTerapeutico'],
    });

    if (!historia) {
      throw new NotFoundException('La historia clínica no existe.');
    }

    if (historia.procesoTerapeutico.idProfesional !== profesionalIdLogueado) {
      throw new ForbiddenException('No tienes permisos para modificar esta historia clínica.');
    }

    // Validación de estado Activo al editar
    if (historia.procesoTerapeutico.idEstadoProcesoTerapeutico !== 1) {
      throw new BadRequestException(
        'No se puede modificar la historia clínica porque el proceso terapéutico está inactivo, dado de alta o derivado.'
      );
    }

    Object.assign(historia, updateData);
    return await this.clinicalHistoryRepository.save(historia);
  }
}