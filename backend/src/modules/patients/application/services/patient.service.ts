import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Patient } from "../../domain/entities/patient.entity";
import type { IPatientRepository } from "../../domain/repositories/patient.repository.interface";

@Injectable()
export class PatientService {
    constructor(
        // inyectamos el repositorio en lugar de la implementacion directa de TypeORM
        @Inject('IPatientRepository')
        private readonly patientRepository: IPatientRepository,
    ) {}

    //1. registra paciente 
    async createPatient(patientData: Partial<Patient>, profesionalId: number): Promise<Patient> {
        const newPatient = new Patient(patientData);
        // el repositoria se encarga de guardar el paciente y vincularlo al profesional
        return this.patientRepository.create(newPatient, profesionalId);
              
    }

    //2. consultat pacientes asignados al profesional
    async getMyPatients(profesionalId: number): Promise<Patient[]> {
        return this.patientRepository.findAllByProfessional(profesionalId);
    }

    //3. modificar paciente 
    async updatePatient(patientId: number, updateData: Partial<Patient>, profesionalId: number): Promise<Patient> {
       // verificamos que el paciente exista y pertenezca al profesional
       const patient = await this.patientRepository.findByIdAndProfessional(patientId, profesionalId);
        
       if (!patient) {
              throw new UnauthorizedException(`No tienes permisos para modificar a este paciente o no existe`);
          
        }

        return this.patientRepository.update(patientId, updateData, profesionalId);
         
    }
}