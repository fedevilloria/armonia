import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalEvolutionOrmEntity } from '../../infrastructure/persistence/clinical-evolution.orm-entity';
import { CreateClinicalEvolutionDto } from '../dto/create-clinical-evolution.dto';

@Injectable()
export class ClinicalEvolutionService {
    constructor(
        @InjectRepository(ClinicalEvolutionOrmEntity)
        private readonly evolutionRepository: Repository<ClinicalEvolutionOrmEntity>,
    ) {}

    async create(dto: CreateClinicalEvolutionDto): Promise<ClinicalEvolutionOrmEntity> {
        const nuevaEvolution = this.evolutionRepository.create(dto);
        return await this.evolutionRepository.save(nuevaEvolution);
    }

    async findAllByHistoriaClinica(idHistoriaClinica: number): Promise<ClinicalEvolutionOrmEntity[]> {
        return await this.evolutionRepository.find({
            where: { idHistoriaClinica },
            order: { idEvolucionClinica: 'DESC'}, // trae las mas recientes
        });
    }
}