export class ClinicalHistory {
    idHistoriaClinica?: number;
    idProcesoTerapeutico!: number;
    motivoConsulta!: string;
    antecedentes!: string;
    diagnostico!: string;

    constructor(partial: Partial<ClinicalHistory>) {
        Object.assign(this, partial);
    }

}