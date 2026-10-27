import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from 'typeorm';
import { ClinicalHistoryOrmEntity} from '../../../clinical-histories/infrastructure/persistence/clinical-history.orm-entity';

@Entity('evoluciones_clinicas')
export class ClinicalEvolutionOrmEntity {
    @PrimaryGeneratedColumn()
    idEvolucionClinica!: number;

    @Column()
    idHistoriaClinica!: number;

    // Relacion Muchaos a Uno con la Historia Clinica
    @ManyToOne(() => ClinicalHistoryOrmEntity, (historia) => historia.evoluciones)
    @JoinColumn({name: 'idHistoriaClinica'})
    historiaClinica!: ClinicalHistoryOrmEntity;

    @Column()
    idTurno!: number;

    @Column({type: 'text'})
    descripcion!: string;
}