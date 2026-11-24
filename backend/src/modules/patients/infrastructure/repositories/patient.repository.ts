import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoDocumento } from '../../../../profesionales/entities/tipo-documento.entity';
import { translateClinicalPersistenceError } from '../../../../database/clinical-persistence-errors';

import { PatientOrmEntity } from '../persistence/patient.orm-entity';
import { Patient } from '../../domain/entities/patient.entity';
import { IPatientRepository } from '../../domain/repositories/patient.repository.interface';
import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';

@Injectable()
export class PatientRepository implements IPatientRepository {
  constructor(
    @InjectRepository(PatientOrmEntity)
    private readonly ormRepository: Repository<PatientOrmEntity>,
  ) {}

  // Mapeador de ORM a dominio
  private toDomain(ormEntity: PatientOrmEntity): Patient {
    return new Patient(ormEntity);
  }

  // Consultar pacientes asociados al profesional
  async findAllByProfessional(idProfessional: number): Promise<Patient[]> {
    const pacientesOrm = await this.ormRepository
      .createQueryBuilder('paciente')
      .where(
        `EXISTS (
          SELECT 1
          FROM procesos_terapeuticos proceso
          WHERE proceso."idPaciente" = paciente."idPaciente"
          AND proceso."idProfesional" = :idProfessional
        )`,
        { idProfessional },
      )
      .getMany();

    return pacientesOrm.map((paciente) => this.toDomain(paciente));
  }

  // Buscar paciente asociado al profesional
  async findByIdAndProfessional(
    idPaciente: number,
    idProfesional: number,
  ): Promise<Patient | null> {
    const pacienteOrm = await this.ormRepository
      .createQueryBuilder('paciente')
      .where('paciente.idPaciente = :idPaciente', { idPaciente })
      .andWhere(
        `EXISTS (
          SELECT 1
          FROM procesos_terapeuticos proceso
          WHERE proceso."idPaciente" = paciente."idPaciente"
          AND proceso."idProfesional" = :idProfesional
        )`,
        { idProfesional },
      )
      .getOne();

    return pacienteOrm ? this.toDomain(pacienteOrm) : null;
  }

  // Registrar paciente y crear su proceso terapéutico inicial
  async create(patient: Patient, idProfesional: number): Promise<Patient> {
    try {
      return await this.ormRepository.manager.transaction(async (manager) => {
        const exists = await manager.existsBy(TipoDocumento, {
          idTipoDocumento: patient.idTipoDocumento,
        });
        if (!exists)
          throw new BadRequestException(
            'El tipo de documento indicado no es válido.',
          );
        // 1. Registrar al paciente
        const pacienteOrm = manager.create(PatientOrmEntity, patient);

        const pacienteGuardado = await manager.save(
          PatientOrmEntity,
          pacienteOrm,
        );

        // 2. Crear el proceso terapéutico inicial
        const procesoTerapeutico = manager.create(TherapeuticProcessOrmEntity, {
          idProfesional,
          paciente: pacienteGuardado,
          idEstadoProcesoTerapeutico: 1, // Activo
          fechaInicio: new Date(),
        });

        // 3. Guardar el proceso terapéutico
        await manager.save(TherapeuticProcessOrmEntity, procesoTerapeutico);

        // 4. Devolver el paciente registrado
        return this.toDomain(pacienteGuardado);
      });
    } catch (error: unknown) {
      throw translateClinicalPersistenceError(error, 'patient-write');
    }
  }

  // Actualizar datos de un paciente asociado al profesional
  async update(
    idPaciente: number,
    patient: Partial<Patient>,
    idProfesional: number,
  ): Promise<Patient> {
    // Verificar que el paciente esté vinculado al profesional
    const pacienteExistente = await this.findByIdAndProfessional(
      idPaciente,
      idProfesional,
    );

    if (!pacienteExistente) {
      throw new NotFoundException('Recurso no encontrado');
    }

    try {
      if (patient.idTipoDocumento !== undefined) {
        const exists = await this.ormRepository.manager.existsBy(
          TipoDocumento,
          { idTipoDocumento: patient.idTipoDocumento },
        );
        if (!exists)
          throw new BadRequestException(
            'El tipo de documento indicado no es válido.',
          );
      }
      // Actualizar los datos del paciente
      await this.ormRepository.update(idPaciente, patient);
    } catch (error: unknown) {
      throw translateClinicalPersistenceError(error, 'patient-write');
    }

    // Recuperar el paciente actualizado
    const updated = await this.ormRepository.findOne({
      where: { idPaciente },
    });

    if (!updated) {
      throw new NotFoundException('Recurso no encontrado');
    }

    return this.toDomain(updated);
  }
}
