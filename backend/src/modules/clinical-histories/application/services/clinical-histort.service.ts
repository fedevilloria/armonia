import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ClinicalHistoryOrmEntity } from "../../infrastructure/persistence/clinical-history.orm-entity";
import { TherapeuticProcessOrmEntity } from "../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity";
import { CreateClinicalHistoryDto } from "../dto/create-clinical-history.dto";
import { NotFoundError } from "rxjs";

@Injectable()
export class ClinicalHistoryService {
    constructor(
        @InjectRepository(ClinicalHistoryOrmEntity) 
        private readonly clinicalHistoryRepository: Repository<ClinicalHistoryOrmEntity>,
        @InjectRepository(TherapeuticProcessOrmEntity)
        private readonly therapeuticProcessRepository: Repository<TherapeuticProcessOrmEntity>,
    ) {}

    async create(dto: CreateClinicalHistoryDto, profesionalIdLogueado: number): Promise<ClinicalHistoryOrmEntity> {
        // 1. buscar el proceso terapeutico vinculado
        const proceso = await this.therapeuticProcessRepository.findOne({
            where: { idProcesoTerapeutico: dto.idProcesoTerapeutico },
        });

        if (!proceso) {
            throw new NotFoundException('El proceso terapéutico especificado no existe.');
        }

        // 2. Regla de negocio: Acceso exclusivo por profesional
        if (proceso.idProfesional !== profesionalIdLogueado){
            throw new ForbiddenException('No tienes permisos para acceder o modificar información clínica de pacientes ajenos.');
        }

        // 3. Regla de negocio: validar estado activo (se asume que 1 es "Activo")
        if (proceso.idEstadoProcesoTerapeutico !== 1){
            throw new BadRequestException('No se puede agregar información a la historia clínica porque el proceso terapéutico no se encuentra activo.');
        }
        
        // 4. Crear y guardar la historia clinica



        
        return await this.clinicalHistoryRepository.save(clinicalHistory);
    }
}