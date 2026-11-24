import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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

  async create(
    dto: CreateClinicalEvolutionDto,
    professionalId: number,
  ): Promise<ClinicalEvolutionOrmEntity> {
    await this.requireAccessibleHistory(dto.idHistoriaClinica, professionalId);
    // Bloqueo deliberado: falta verificar Turno -> Proceso, no basta aceptar idTurno.
    throw new ServiceUnavailableException(
      'El registro de evoluciones clínicas no está disponible.',
    );
  }

  async findAllByHistoriaClinica(
    idHistoriaClinica: number,
    professionalId: number,
  ): Promise<ClinicalEvolutionOrmEntity[]> {
    await this.requireAccessibleHistory(idHistoriaClinica, professionalId);
    return await this.evolutionRepository.find({
      where: {
        idHistoriaClinica,
        historiaClinica: {
          procesoTerapeutico: { idProfesional: professionalId },
        },
      },
    });
  }

  private async requireAccessibleHistory(
    idHistoriaClinica: number,
    professionalId: number,
  ): Promise<void> {
    const history = await this.historyRepository.findOne({
      where: {
        idHistoriaClinica,
        procesoTerapeutico: { idProfesional: professionalId },
      },
    });
    if (!history) throw new NotFoundException('Recurso no encontrado');
  }
}
