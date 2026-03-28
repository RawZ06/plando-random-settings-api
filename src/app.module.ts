import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeneratorModule } from './generator/generator.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), GeneratorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
