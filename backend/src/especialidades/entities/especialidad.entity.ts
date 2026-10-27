import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('especialidades')
export class Especialidad {
  @PrimaryGeneratedColumn()
  idEspecialidad!: number;

  @Column({ unique: true })
  nombre!: string;

  @Column()
  descripcion!: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  fechaBaja!: Date | null;
}