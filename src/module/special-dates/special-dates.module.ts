import { Module } from '@nestjs/common';
import { SpecialDatesService } from 'src/module/special-dates/special-dates.service';
import { SpecialDatesController } from './special-dates.controller';

@Module({
  controllers: [SpecialDatesController],
  providers: [SpecialDatesService],
})
export class SpecialDatesModule {}
