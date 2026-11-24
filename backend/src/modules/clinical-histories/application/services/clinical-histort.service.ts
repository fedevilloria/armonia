import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { ClinicalHistoryOrmEntity } from '../../infrastructure/persistence/clinical-history.orm-entity';
import { CreateClinicalHistoryDto } from '../dto/create-clinical-history.dto';
import { translateClinicalPersistenceError } from '../../../../database/clinical-persistence-errors';

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @InjectRepository(ClinicalHistoryOrmEntity)
    private readonly clinicalHistoryRepository: Repository<ClinicalHistoryOrmEntity>,
    @InjectRepository(TherapeuticProcessOrmEntity)
    private readonly therapeuticProcessRepository: Repository<TherapeuticProcessOrmEntity>,
  ) {}

  async create(
    dto: CreateClinicalHistoryDto,
    professionalId: number,
  ): Promise<ClinicalHistoryOrmEntity> {
    // 1. buscar el proceso terapeutico vinculado
    const proceso = await this.therapeuticProcessRepository.findOne({
      where: {
        idProcesoTerapeutico: dto.idProcesoTerapeutico,
        idProfesional: professionalId,
      },
    });

    if (!proceso) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // Conserva la regla existente: solo el estado Activo del catalogo persistido.
    if (proceso.idEstadoProcesoTerapeutico !== 1) {
      throw new BadRequestException(
        'No se puede agregar información a la historia clínica porque el proceso terapéutico no se encuentra activo.',
      );
    }

    // 4. Crear y guardar la historia clinica
    const clinicalHistory = this.clinicalHistoryRepository.create(dto);
    try {
      return await this.clinicalHistoryRepository.save(clinicalHistory);
    } catch (error: unknown) {
      throw translateClinicalPersistenceError(error);
    }
  }
}
