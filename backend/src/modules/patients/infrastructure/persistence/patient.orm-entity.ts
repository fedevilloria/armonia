import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

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
    fechaNacimiento!: Date;

    @Column()
    direccion!: string;

    @Column({ nullable: true })
    nombreContactoEmergencia?: string;

    @Column({ nullable: true })
    telefonoContactoEmergencia?: string;

    // Más adelante, se agrega la relacion @OneToMany con ProcesoTerapeutico
    
}