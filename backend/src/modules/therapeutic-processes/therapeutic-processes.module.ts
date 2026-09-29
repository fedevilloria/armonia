import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TherapeuticProcessOrmEntity } from './infrastructure/persistence/therapeutic-process.orm-entity';
import { TherapeuticProcessController} from './presentation/controllers/therapeutic-process.controller';
import { TherapeuticProcessService } from './application/services/therapeutic-process.service';

@Module({
  imports: [TypeOrmModule.forFeature([TherapeuticProcessOrmEntity])],
  controllers: [TherapeuticProcessController],
  providers: [TherapeuticProcessService],
  exports: [TherapeuticProcessService], // lo exportamos por si otro modulo lo necesita a futuro
})
export class TherapeuticProcessesModule {}
