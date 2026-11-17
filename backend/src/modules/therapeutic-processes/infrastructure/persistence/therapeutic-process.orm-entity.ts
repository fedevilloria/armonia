import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { PatientOrmEntity } from '../../../patients/infrastructure/persistence/patient.orm-entity';

import { Profesional } from '../../../../profesionales/entities/profesional.entity';
import { TherapeuticProcessStateOrmEntity } from './therapeutic-process-state.orm-entity';

@Index('IDX_proceso_activo_por_paciente', ['paciente'], {
  unique: true,
  where: '"idEstadoProcesoTerapeutico" = 1',
})
@Entity('procesos_terapeuticos')
export class TherapeuticProcessOrmEntity {
  @PrimaryGeneratedColumn()
  idProcesoTerapeutico!: number;

  @Column()
  idProfesional!: number;

  @ManyToOne(() => Profesional, {
    nullable: false,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'idProfesional',
    referencedColumnName: 'idProfesional',
    foreignKeyConstraintName: 'FK_proceso_profesional',
  })
  professional!: Profesional;

  @ManyToOne(() => PatientOrmEntity, {
    nullable: false,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'idPaciente',
    referencedColumnName: 'idPaciente',
    foreignKeyConstraintName: 'FK_f44e41450be30579e7a719a65aa',
  })
  paciente!: PatientOrmEntity;

  @Column()
  idEstadoProcesoTerapeutico!: number;

  @ManyToOne(() => TherapeuticProcessStateOrmEntity, {
    nullable: false,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'idEstadoProcesoTerapeutico',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_proceso_estado',
  })
  state!: TherapeuticProcessStateOrmEntity;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @Column({ type: 'date' })
  fechaInicio!: Date;

  @Column({ type: 'date', nullable: true })
  fechaFinalizacion!: Date;

  @Column({ type: 'text', nullable: true })
  motivoFinalizacion!: string;
}
