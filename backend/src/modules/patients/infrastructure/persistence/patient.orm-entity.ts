import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { TipoDocumento } from '../../../../profesionales/entities/tipo-documento.entity';

@Unique('UQ_patients_tipo_numero_documento', [
  'idTipoDocumento',
  'numeroDocumento',
])
@Entity('patients') // Nombre de la tabla en PostgreSQL
export class PatientOrmEntity {
  @PrimaryGeneratedColumn()
  idPaciente!: number;

  @Column()
  nombre!: string;

  @Column()
  apellido!: string;

  @Column()
  telefono!: string;

  @Column()
  correoElectronico!: string;

  @Column()
  idTipoDocumento!: number;

  @ManyToOne(() => TipoDocumento, {
    nullable: false,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({
    name: 'idTipoDocumento',
    referencedColumnName: 'idTipoDocumento',
    foreignKeyConstraintName: 'FK_patients_tipo_documento',
  })
  documentType!: TipoDocumento;

  @Column()
  numeroDocumento!: string;

  @Column({ type: 'date' })
  fechaNacimiento!: string;

  @Column()
  direccion!: string;

  @Column({ nullable: true })
  nombreContactoEmergencia?: string;

  @Column({ nullable: true })
  telefonoContactoEmergencia?: string;

  @Column({ type: 'boolean', default: false })
  pareja!: boolean;

  // Más adelante, se agrega la relacion @OneToMany con ProcesoTerapeutico
}
