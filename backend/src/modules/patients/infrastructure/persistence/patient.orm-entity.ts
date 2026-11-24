import {Entity, Column, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import { TherapeuticProcessOrmEntity } from '../../../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';

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

    @Column({type: 'boolean', default: false})
    pareja!: boolean;

    @OneToMany(() => TherapeuticProcessOrmEntity, (proceso) => proceso.paciente)
    procesosTerapeuticos!: TherapeuticProcessOrmEntity[];
    
}