import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PatientOrmEntity} from '../persistence/patient.orm-entity';
import {Patient} from '../../domain/entities/patient.entity';
import {IPatientRepository} from '../../domain/repositories/patient.repository.interface';

@Injectable()
export class PatientRepository implements IPatientRepository {
    constructor(
        @InjectRepository(PatientOrmEntity)
        private readonly ormRepository: Repository<PatientOrmEntity>,
    ) {}

    //Mapeador simple de ORM a Dominio
    private toDomain(ormEntity: PatientOrmEntity): Patient {
        return new Patient(ormEntity);
    }

    async findAllByProfessional(idProfessional: number): Promise<Patient[]> {
        const pacientesOrm = await this.ormRepository.find({
            //Logica para filatrar solo los pacientes que tengan un proceso terapeutico con este profesional
            /* sacar cuando la relacion este armada:
            where: {
              procesosTerapeuticos: {
                idProfesional: idProfesional
                }
            }
            */

        });
        return pacientesOrm.map(this.toDomain);   
    }

    async findByIdAndProfessional(idPaciente: number, idProfesional: number): Promise<Patiente | null> {
         const pacienteOrm = await this.ormRepository.findOne({
            where: { idPaciente: idPaciente}
        });
        return pacienteOrm ? this.toDomain(pacienteOrm) : null;
    }

    async create(patiente: Patient, idProfesional: number): Promise<Patient> {
        const ormEntity = this.ormRepository.create(patiente);
        const saved = await this.ormRepository.save(ormEntity);
        // aca se debe crar tambien el proceso terapeutico inical que vincula al paciente con el profesional
        return this.toDomain(saved);
    }
    
    async update(idPaciente: number, patient: Partial<Patient>, idProfesional: number): Promise<Patient> {
       // se actualiza el registro en la base de datos
        await this.ormRepository.update(idPaciente, patient);
       // se busca como quedo el registro actualizado
        const updated = await this.ormRepository.findOne({ where: { idPaciente: idPaciente } });
       // verificamos que no sea null
       if (!updated) {
           throw new NotFoundException(`El paciente con id ${idPaciente} no fue encontrado`);
       }
       // lo convertimos al domino en forma segura
       return this.toDomain(updated);
    
    } 
}
