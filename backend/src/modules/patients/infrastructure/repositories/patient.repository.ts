import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PatientOrmEntity} from '../persistence/patient.orm-entity';
import {Patient} from '../../domain/entities/patient.entity';
import {IPatientRepository} from '../../domain/repositories/patient.repository';

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

    