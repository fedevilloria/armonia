import { Module } from '@nestjs/common';
import { TypeOrmModule} from '@nestjs/typeorm';
import { ClinicalHistoryOrmEntity} from './infrastructure/persistence/clinical-history.orm-entity';
import { TherapeuticProcessOrmEntity } from '../therapeutic-processes/infrastructure/persistence/therapeutic-process.orm-entity';
import { ClinicalHistoryController } from './presentation/controllers/clinical-history.controller';
import { ClinicalHistoryService } from './application/services/clinical-histort.service';


@Module({
    imports: [
        TypeOrmModule.forFeature([
            ClinicalHistoryOrmEntity,
            TherapeuticProcessOrmEntity
        ])
    ],
    controllers: [ClinicalHistoryController],
    providers: [ClinicalHistoryService],
    exports: [ClinicalHistoryService],
})
export class ClinicalHistoriesModule {}
