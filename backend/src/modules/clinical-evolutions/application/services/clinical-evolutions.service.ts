import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    // 1. Buscamos la historia clínica incluyendo su proceso terapéutico (para ver quién es el dueño)
    const historia = await this.historyRepository.findOne({
      where: { idHistoriaClinica: dto.idHistoriaClinica },
      relations: ['procesoTerapeutico'], 
    });

    if (!historia) {
      throw new NotFoundException('La historia clínica especificada no existe.');
    }

    // 2. REGLA DE NEGOCIO: Acceso exclusivo por profesional
    if (historia.procesoTerapeutico.idProfesional !== profesionalIdLogueado) {
      throw new ForbiddenException('No tienes permisos para registrar evoluciones en historias clínicas de pacientes ajenos.');
    }

    // 3. Guardamos la evolución
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

    // REGLA DE NEGOCIO: Restringir lectura
    if (historia.procesoTerapeutico.idProfesional !== profesionalIdLogueado) {
      throw new ForbiddenException('No tienes permisos para consultar las evoluciones de este paciente.');
    }

    return await this.evolutionRepository.find({
      where: { idHistoriaClinica },
    });
  }
}