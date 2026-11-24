
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { Patient } from '../../domain/entities/patient.entity';
import { IPatientRepository } from '../../domain/repositories/patient.repository.interface';
import { PatientOrmEntity } from '../persistence/patient.orm-entity';

@Injectable()
export class PatientRepository implements IPatientRepository {
  constructor(
    @InjectRepository(PatientOrmEntity)
    private readonly ormRepository: Repository<PatientOrmEntity>,
  ) {}

  // Mapeador de ORM a dominio
  private toDomain(ormEntity: PatientOrmEntity): Patient {
    return new Patient({
      ...ormEntity,
      fechaNacimiento: new Date(ormEntity.fechaNacimiento),
    });
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
  async create(
    patient: Patient,
    idProfesional: number,
  ): Promise<Patient> {
    try {
      return await this.ormRepository.manager.transaction(
        async (manager) => {
          // 1. Registrar al paciente
          const pacienteOrm = manager.create(
            PatientOrmEntity,{
              ...patient,
              fechaNacimiento:
              patient.fechaNacimiento instanceof Date
                ? patient.fechaNacimiento.toISOString().split('T')[0]
                : patient.fechaNacimiento,

            },
            
          );

          const pacienteGuardado = await manager.save(
            PatientOrmEntity,
            pacienteOrm,
          );

          // 2. Crear el proceso terapéutico inicial
          const procesoTerapeutico = manager.create(
            TherapeuticProcessOrmEntity,
            {
              idProfesional,
              paciente: pacienteGuardado,
              idEstadoProcesoTerapeutico: 1, // Activo
              fechaInicio: new Date(),
            },
          );

          // 3. Guardar el proceso terapéutico
          await manager.save(
            TherapeuticProcessOrmEntity,
            procesoTerapeutico,
          );

          // 4. Devolver el paciente registrado
          return this.toDomain(pacienteGuardado);
        },
      );
    } catch (error: unknown) {
      // PostgreSQL: 23505 = violación de restricción UNIQUE
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === '23505' &&
          driverError.constraint ===
            'UQ_patients_tipo_numero_documento'
        ) {
          throw new ConflictException(
            'Ya existe un paciente registrado con ese tipo y número de documento.',
          );
        }
      }

      // Otros errores se propagan sin modificarlos
      throw error;
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
      throw new NotFoundException(
        `El paciente con id ${idPaciente} no fue encontrado`,
      );
    }

    try {
      // Actualizar los datos del paciente
      const {fechaNacimiento, ...restDatos} = patient;
      await this.ormRepository.update(idPaciente, {
        ...restDatos,
        ...(fechaNacimiento && {
          fechaNacimiento:
            fechaNacimiento instanceof Date
              ? fechaNacimiento.toISOString().split('T')[0]
              : fechaNacimiento,
        }),
      });
    } catch (error: unknown) {
      // Detectar documentos duplicados durante una actualización
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === '23505' &&
          driverError.constraint ===
            'UQ_patients_tipo_numero_documento'
        ) {
          throw new ConflictException(
            'Ya existe un paciente registrado con ese tipo y número de documento.',
          );
        }
      }

      throw error;
    }

    // Recuperar el paciente actualizado
    const updated = await this.ormRepository.findOne({
      where: { idPaciente },
    });

    if (!updated) {
      throw new NotFoundException(
        `El paciente con id ${idPaciente} no fue encontrado`,
      );
    }

    return this.toDomain(updated);
  }
}
