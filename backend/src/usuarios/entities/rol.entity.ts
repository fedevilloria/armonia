import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  idRol!: number;

  @Column({ unique: true })
  nombre!: string;

  @Column()
  descripcion!: string;
}