export class Patient {
    idPaciente?: number;
    nombre!: string;
    apellido!: string;
    telefono!: string;
    correoElectronico!: string;
    idTipoDocumento!: number;
    numeroDocumento!: string;
    fechaNacimiento!: Date;
    direccion!: string;
    nombreContactoEmergencia?: string;
    telefonoContactoEmergencia?: string;

    constructor(partial: Partial<Patient>) {
        Object.assign(this, partial);
    }
}