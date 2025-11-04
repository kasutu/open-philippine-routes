import { RegistryService } from '@registry/registry';
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly registry: RegistryService) {}

  /**
   * GET /:version/:city
   * Example: /v1/iloilo
   */
  @Get('/:version/:city')
  getRoutesByCity(
    @Param('version') versionParam: string, // e.g. "v1"
    @Param('city') city: string, // e.g. "iloilo"
  ) {
    // 1. Validate and extract version number
    const versionMatch = versionParam.match(/^v(\d+)$/);
    if (!versionMatch) {
      throw new BadRequestException(
        'Version must be in format "v1", "v12", etc.',
      );
    }
    const version = versionMatch[1]; // "1"

    // 2. Get all route files in this version
    const routeFiles = this.registry.listRoutesInVersion(version);
    if (routeFiles.length === 0) {
      throw new NotFoundException(`No routes published in version v${version}`);
    }

    // 3. Normalize query city for comparison
    const queryCityNorm = city.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 4. Search for a file where the city matches
    for (const file of routeFiles) {
      const data = this.registry.getByVersionAndFile(version, file);
      if (!data) continue;

      const dataCityNorm = data.city.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (dataCityNorm === queryCityNorm) {
        return data; // ✅ return full City with all routes
      }
    }

    // 5. Not found
    throw new NotFoundException(
      `No route data found for city "${city}" in version v${version}`,
    );
  }
}
