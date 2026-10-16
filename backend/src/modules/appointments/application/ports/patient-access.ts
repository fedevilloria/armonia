// La implementacion real debe comprobar pertenencia persistida en la transaccion.
export interface PatientAccess {
  canAssign(patientId: number, professionalId: number): Promise<boolean>;
}
