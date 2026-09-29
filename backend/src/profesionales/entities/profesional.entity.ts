import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Especialidad } from '../../especialidades/entities/especialidad.entity';
import { TipoDocumento } from './tipo-documento.entity';

@Entity('profesionales')
export class Profesional {
  @PrimaryGeneratedColumn()
  idProfesional!: number;

  @Column({ unique: true })
  nroDNI!: string;

  @Column({ unique: true })
  matricula!: string;

  @Column()
  telefono!: string;

  @Column()
  descripcionProfesional!: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  fechaBaja!: Date | null;

  @OneToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'idUsuario' })
  usuario!: Usuario;

  @ManyToOne(() => TipoDocumento, { nullable: false })
  @JoinColumn({ name: 'idTipoDocumento' })
  tipoDocumento!: TipoDocumento;

  @ManyToOne(() => Especialidad, { nullable: false })
  @JoinColumn({ name: 'idEspecialidad' })
  especialidad!: Especialidad;
}