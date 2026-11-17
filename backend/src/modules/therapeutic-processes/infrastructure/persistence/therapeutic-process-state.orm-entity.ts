import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

// Catalogo persistido; los valores iniciales pertenecen a la migracion existente.
@Entity('estados_proceso_terapeutico')
@Unique('UQ_estados_proceso_nombre', ['name'])
export class TherapeuticProcessStateOrmEntity {
  @PrimaryGeneratedColumn({
    name: 'idEstadoProcesoTerapeutico',
    type: 'integer',
    primaryKeyConstraintName: 'PK_estados_proceso',
  })
  id!: number;

  @Column({ name: 'nombre', type: 'varchar' })
  name!: string;
}
