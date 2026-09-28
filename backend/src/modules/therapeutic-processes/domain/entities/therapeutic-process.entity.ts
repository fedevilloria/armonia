export class TherapeuticProcess {
    idProcesoTerapeutico?: number;
    idProfesional?: number;
    idPaciente?: number;
    idEstadoProcesoTerapeutico?: number; // relacion con la tabla de estados
    observaciones?: string;
    fechaInicio?: Date;
    fechaFinalizacion?: Date;
    motivoFinalizacion?: string;

    constructor(patrial: Partial<TherapeuticProcess>) {
        Object.assign(this, patrial);
    }
}