import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { OneToMany } from 'typeorm';
import { ClinicalEvolutionOrmEntity } from '../../../clinical-evolutions/infrastructure/persistence/clinical-evolution.orm-entity';

@Entity('historias_clinicas')
export class ClinicalHistoryOrmEntity {
    @PrimaryGeneratedColumn()
    idHistorialClinica!: number;

    @Column()
    idProcesoTerapeutico!: number;

    //Relacion 1 a 1 con el proceso terapeutico
    @OneToOne(()=> TherapeuticProcessOrmEntity)
    @JoinColumn({name:'idProcesoTerapeutico'})
    procesoTerapeutico!: TherapeuticProcessOrmEntity;

    @Column({type:'text' })
    motivoConsulta!: string;

    @Column({type:'text' })
    antecedentes!: string;
    
    @Column({type:'text' })
    diagnostico!: string;


    @OneToMany(() => ClinicalEvolutionOrmEntity, (evolucion: ClinicalEvolutionOrmEntity) => evolucion.historiaClinica)
    evoluciones!: ClinicalEvolutionOrmEntity[];
}