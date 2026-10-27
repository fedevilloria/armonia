export class ClinicalEvolution {
    idEvolucionClinica?: number;
    idHistoriaClinica?: number;
    idTurno?: number;
    descripcion?: string;

    constructor(partial: Partial<ClinicalEvolution>){
        Object.assign(this, partial);
    }
}