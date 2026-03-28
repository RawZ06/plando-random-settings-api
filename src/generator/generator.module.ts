import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { HintsService } from './hints.service';
import { WeightService } from './weight.service';
import { ConditionalsService } from './conditionals.service';
import { SettingsMetadataService } from './settings-metadata.service';

@Module({
  imports: [ConfigModule],
  controllers: [GenerateController],
  providers: [
    GenerateService,
    WeightService,
    ConditionalsService,
    SettingsMetadataService,
    HintsService,
  ],
})
export class GeneratorModule {}
