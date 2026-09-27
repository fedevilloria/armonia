import {Controller, Get, Post, Body, Param, ParseIntPipe} from '@nestjs/common';
import {PatientService} from '../../application/services/patient.service';

@Controller('patients') //esta sera la ruta base: http://localhost:3000/patients
export class PatientController {
    constructor(private readonly patientService: PatientService) {}

    //1. Registrar paciente (POST)
    @Post()
    async create(@Body() createPatientDto: any) {
       // hasta que este el modulo de autenticacion, simulo que el profesional logueado tiene el id 1
         const profesionalId = 1;

       
        return this.patientService.createPatient(createPatientDto, profesionalId);
    }

    //2. consultar pacientes asignado al profesionsl (GET)
    @Get()
    async findAll() {
        //simular el id del profesional logueado
        const profesionalId = 1;
        return this.patientService.getMyPatients(profesionalId);
    }

    //3. modificar paciente (PUT)
    @Post(':id')
    async update(
        @Param('id', ParseIntPipe) idPaciente: number,
        @Body() updatePatientDto: any,
    ) {
        //simular el id del profesional logueado
        const profesionalId = 1;
        return this.patientService.updatePatient(idPaciente, updatePatientDto, profesionalId);
    }
}