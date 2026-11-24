import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalEvolutionOrmEntity } from '../../infrastructure/persistence/clinical-evolution.orm-entity';
import { ClinicalHistoryOrmEntity } from '../../../clinical-histories/infrastructure/persistence/clinical-history.orm-entity';
import { CreateClinicalEvolutionDto } from '../dto/create-clinical-evolution.dto';

@Injectable()
export class ClinicalEvolutionService {
  constructor(
    @InjectRepository(ClinicalEvolutionOrmEntity)
    private readonly evolutionRepository: Repository<ClinicalEvolutionOrmEntity>,
    @InjectRepository(ClinicalHistoryOrmEntity)
    private readonly historyRepository: Repository<ClinicalHistoryOrmEntity>,
  ) {}

  async create(dto: CreateClinicalEvolutionDto, profesionalIdLogueado: number): Promise<ClinicalEvolutionOrmEntity> {
    const historia = await this.historyRepository.findOne({
      where: { idHistoriaClinica: dto.idHistoriaClinica },
      relations: ['procesoTerapeutico'],
    });

    if (!historia) {
      throw new NotFoundException('La historia clínica especificada no existe.');
    }

    // 1. Validar dueño del proceso
    if (historia.procesoTerapeutico.idProfesional !== profesionalIdLogueado) {
      throw new ForbiddenException('No tienes permisos para registrar evoluciones en historias clínicas de pacientes ajenos.');
    }

    // 2. Validar que el proceso esté Activo (1 = Activo)
    if (historia.procesoTerapeutico.idEstadoProcesoTerapeutico !== 1) {
      throw new BadRequestException(
        'No se puede registrar una evolución clínica porque el proceso terapéutico no se encuentra activo.'
      );
    }

    const nuevaEvolucion = this.evolutionRepository.create(dto);
    return await this.evolutionRepository.save(nuevaEvolucion);
  }

  async findAllByHistoriaClinica(idHistoriaClinica: number, profesionalIdLogueado: number): Promise<ClinicalEvolutionOrmEntity[]> {
    const historia = await this.historyRepository.findOne({
      where: { idHistoriaClinica },
      relations: ['procesoTerapeutico'],
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada.');
    }

    // Nota: Acá NO bloqueamos si el proceso está cerrado, porque la regla de negocio exige
    // conservar y permitir consultar la información clínica histórica tras finalizar el proceso.
    if (historia.procesoTerapeutico.idProfesional !== profesionalIdLogueado) {
      throw new ForbiddenException('No tienes permisos para consultar las evoluciones de este paciente.');
    }

    return await this.evolutionRepository.find({
      where: { idHistoriaClinica },
    });
  }
}