import {Injectable, BadRequestException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {TherapeuticProcessOrmEntity} from '../../infrastructure/persistence/therapeutic-process.orm-entity';
import {CreateTherapeuticProcessDto} from '../dto/create-therapeutic-process.dto';

@Injectable()
export class TherapeuticProcessService {
    constructor(
        @InjectRepository(TherapeuticProcessOrmEntity)
        private readonly processRepository: Repository<TherapeuticProcessOrmEntity>,
    ) {}

    async create(dto: CreateTherapeuticProcessDto): Promise<TherapeuticProcessOrmEntity> {
        // Aplicamos la regla: validar que el paciente no tenga ya un proceso asociado
        const procesoExistente = await this.processRepository.findOne({
            where: {
                paciente: { idPaciente: dto.idPaciente }
            },
        });

        if (procesoExistente){
            throw new BadRequestException('El paciente ya tiene un proceso terapéutico registrado en el sistema.');
        }

        // El estado 1 representa "Activo" segun el diagrama de estados
        const nuevoProceso = this.processRepository.create({
            idProfesional: dto.idProfesional,
            paciente: { idPaciente: dto.idPaciente},
            idEstadoProcesoTerapeutico: 1,
            fechaInicio: new Date(),
            observaciones: dto.observaciones,
        });

        return await this.processRepository.save(nuevoProceso);
    }
}
