import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ClinicalEvolutionOrmEntity} from './infrastructure/persistence/clinical-evolution.orm-entity';
import {ClinicalEvolutionController} from './presentation/controllers/clinical-evolution.controller';
import {ClinicalEvolutionService} from './application/services/clinical-evolutions.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ClinicalEvolutionOrmEntity]),
    ],
    controllers: [ClinicalEvolutionController],
    providers: [ClinicalEvolutionService],
})
export class ClinicalEvolutionsModule {}