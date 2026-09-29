import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Rol } from './rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  idUsuario!: number;

  @Column()
  nombre!: string;

  @Column()
  apellido!: string;

  @Column({ unique: true })
  correoElectronico!: string;

  @Column({
    select: false,
  })
  contrasena!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;

  @ManyToOne(() => Rol, { nullable: false })
  @JoinColumn({ name: 'idRol' })
  rol!: Rol;
}