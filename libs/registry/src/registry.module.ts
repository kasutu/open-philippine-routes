import { Module } from '@nestjs/common';
import { RegistryService } from './registry.service';

@Module({
  providers: [RegistryService],
  exports: [RegistryService],
})
export class RegistryModule {}
