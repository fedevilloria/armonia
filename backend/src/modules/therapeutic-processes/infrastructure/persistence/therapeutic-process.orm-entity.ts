import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PatientOrmEntity } from '../../../../patient/infrastructure/persistence/patient.orm-entity';

@Entity('procesos_terapeuticos')
export class TherapeuticProcessOrmEntity {
    @PrimaryGeneratedColumn()
    idProcesoTerapeutico!: number;

    @Column()
    idProfesional!: number;

    @ManyToOne(() => PatientOrmEntity, (paciente) => paciente.procesosTerapeuticos)
    @JoinColumn({ name: 'idPaciente' })
    paciente: PatientOrmEntity;

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
}