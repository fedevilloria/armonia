import {Patient} from "../entities/patient.entity";

export interface IPatientRepository {
    // Regla de negocio: El profesional solo accede a sus pacientes
    findAllByProfessional(idProfesional: number): Promise<Patient[]>;

    findByIdAndProfessional(idPaciente: number, idProfesional: number): Promise<Patient | null>;

    create(patient: Patient, idProfesional: number): Promise<Patient>;
    
    update(idPaciente: number, patient: Partial<Patient>, idProfesional: number): Promise<Patient>;

}