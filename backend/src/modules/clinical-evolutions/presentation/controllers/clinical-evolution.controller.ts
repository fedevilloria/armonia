import {Body, Controller, Get, Param, ParseIntPipe, Post} from '@nestjs/common';
import { ClinicalEvolutionService } from '../../application/services/clinical-evolutions.service';
import { CreateClinicalEvolutionDto } from '../../application/dto/create-clinical-evolution.dto';

@Controller('evoluciones-clinicas')
export class ClinicalEvolutionController {
    constructor(private readonly evolutionService: ClinicalEvolutionService) {}

    @Post()
    async create(@Body() createDto: CreateClinicalEvolutionDto){
        return await this.evolutionService.create(createDto);
    }

    @Get('historia-clinica/:idHistoriaClinica')
    async findAllByHistoriaClinica(@Param('idHistoriaClinica', ParseIntPipe) idHistoriaClinica: number){
        return await this.evolutionService.findAllByHistoriaClinica(idHistoriaClinica);
    }
}