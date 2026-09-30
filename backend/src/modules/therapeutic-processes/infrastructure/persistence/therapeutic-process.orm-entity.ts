import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PatientOrmEntity } from '../../../patients/infrastructure/persistence/patient.orm-entity';
import { OneToOne } from 'typeorm';
import { ClinicalHistoryOrmEntity } from '../../../clinical-histories/infrastructure/persistence/clinical-history.orm-entity';

@Entity('procesos_terapeuticos')
export class TherapeuticProcessOrmEntity {
    @PrimaryGeneratedColumn()
    idProcesoTerapeutico!: number;

    @Column()
    idProfesional!: number;

    @ManyToOne(() => PatientOrmEntity)
    @JoinColumn({ name: 'idPaciente' })
    paciente!: PatientOrmEntity;

    @Column()
    idEstadoProcesoTerapeutico!: number;

    @Column({type: 'text', nullable: true})
    observaciones!: string;

    @Column({type: 'date'})
    fechaInicio!: Date;

    @Column({type: 'date', nullable: true})
    fechaFinalizacion!: Date;

    @Column({type: 'text', nullable: true})
    motivoFinalizacion!: string;

    @OneToOne(()=> ClinicalHistoryOrmEntity, (historia) => historia.procesoTerapeutico)
    historiaClinica!: ClinicalHistoryOrmEntity;
}