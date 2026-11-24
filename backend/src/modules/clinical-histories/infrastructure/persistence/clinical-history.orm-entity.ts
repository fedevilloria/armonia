import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { OneToMany } from 'typeorm';
import { ClinicalEvolutionOrmEntity } from '../../../clinical-evolutions/infrastructure/persistence/clinical-evolution.orm-entity';

@Entity('historias_clinicas')
export class ClinicalHistoryOrmEntity {
  @PrimaryGeneratedColumn()
  idHistoriaClinica!: number;

  @Column()
  idProcesoTerapeutico!: number;

  //Relacion 1 a 1 con el proceso terapeutico
  @OneToOne(
    () => TherapeuticProcessOrmEntity,
    (process) => process.historiaClinica,
    {
      nullable: false,
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
  )
  @JoinColumn({
    name: 'idProcesoTerapeutico',
    foreignKeyConstraintName: 'FK_99bea3b5f1d3273a49c933e9956',
  })
  procesoTerapeutico!: TherapeuticProcessOrmEntity;

  @Column({ type: 'text' })
  motivoConsulta!: string;

  @Column({ type: 'text' })
  antecedentes!: string;

  @Column({ type: 'text' })
  diagnostico!: string;

  @OneToMany(
    () => ClinicalEvolutionOrmEntity,
    (evolucion: ClinicalEvolutionOrmEntity) => evolucion.historiaClinica,
  )
  evoluciones!: ClinicalEvolutionOrmEntity[];
}
