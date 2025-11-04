import { RegistryService } from './registry.service';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'bun:test';

describe('RegistryService', () => {
  let service: RegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistryService],
    }).compile();

    service = module.get<RegistryService>(RegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
