import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClinicalHistoryOrmEntity } from '../../../clinical-histories/infrastructure/persistence/clinical-history.orm-entity';

@Entity('evoluciones_clinicas')
export class ClinicalEvolutionOrmEntity {
  @PrimaryGeneratedColumn()
  idEvolucionClinica!: number;

  @Column()
  idHistoriaClinica!: number;

  // Relacion Muchaos a Uno con la Historia Clinica
  @ManyToOne(
    () => ClinicalHistoryOrmEntity,
    (historia) => historia.evoluciones,
    {
      nullable: false,
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
  )
  @JoinColumn({
    name: 'idHistoriaClinica',
    foreignKeyConstraintName: 'FK_3255ca44b9a70bb0896f47d28e8',
  })
  historiaClinica!: ClinicalHistoryOrmEntity;

  @Column()
  idTurno!: number;

  @Column({ type: 'text' })
  descripcion!: string;
}
