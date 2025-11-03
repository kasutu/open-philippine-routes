import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { RegistryService } from '@registry/registry';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [RegistryService],
})
export class AppModule {}
