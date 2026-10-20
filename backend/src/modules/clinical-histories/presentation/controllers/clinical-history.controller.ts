import {Controller, Post, Body} from '@nestjs/common';
import { ClinicalHistoryService } from '../../application/services/clinical-histort.service';
import { CreateClinicalHistoryDto } from '../../application/dto/create-clinical-history.dto';

@Controller('historias-clinicas')
export class ClinicalHistoryController {
    constructor(private readonly clinicalHistoryService: ClinicalHistoryService) {}

    @Post()
    async create(@Body() dto: CreateClinicalHistoryDto) {
        //simulamos temporalmente el ID del profesional logueado en 1 hasta integrar autenticacion
        const profesionalIdLogueado = 1;
        return await this.clinicalHistoryService.create(dto, profesionalIdLogueado);

    }
}