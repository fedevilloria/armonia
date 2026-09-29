import {Controller, Post, Body} from '@nestjs/common';
import {TherapeuticProcessService} from '../../application/services/therapeutic-process.service';
import {CreateTherapeuticProcessDto} from '../../application/dto/create-therapeutic-process.dto';

@Controller('procesos-terapeuticos')
export class TherapeuticProcessController {
    constructor(private readonly processService: TherapeuticProcessService) {}

    @Post()
    async create(@Body() createDto: CreateTherapeuticProcessDto) {
        return await this.processService.create(createDto);
    }

}


