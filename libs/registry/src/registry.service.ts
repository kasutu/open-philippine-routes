import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync
  } from 'fs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { join, resolve } from 'path';
import { OPRResponse } from '@registry/registry/schema/schema';

@Injectable()
export class RegistryService implements OnModuleInit {
  private dataMap = new Map<string, OPRResponse>();
  private locationIndex = new Map<string, string>();
  private logger = new Logger(RegistryService.name);

  onModuleInit() {
    this.loadRegistryData();
  }

  private loadRegistryData() {
    const isProduction = process.env.NODE_ENV === 'production';

    let sourceDir: string;
    let label: string;

    if (isProduction) {
      // In dist/, data is copied to dist/data
      sourceDir = resolve(__dirname, 'data');
      label = 'published (prod)';
    } else {
      // In dev, drafts are in src/next (same level as this file)
      sourceDir = resolve(__dirname, '..', 'libs', 'registry', 'src', 'next');
      label = 'drafts (dev)';
    }

    if (!existsSync(sourceDir)) {
      this.logger.warn(`Registry ${label} directory not found: ${sourceDir}`);
      return;
    }

    try {
      const versionDirs = readdirSync(sourceDir).filter((name) =>
        /^v\d+$/.test(name),
      );

      if (versionDirs.length === 0) {
        this.logger.warn(`No ${label} versions found in: ${sourceDir}`);
        return;
      }

      for (const dir of versionDirs) {
        const version = dir.replace(/^v/, '');
        const dirPath = join(sourceDir, dir);

        if (!statSync(dirPath).isDirectory()) continue;

        // Skip schema file
        const files = readdirSync(dirPath).filter(
          (f) => f.endsWith('.json') && !f.endsWith('.schema.json'),
        );

        for (const file of files) {
          try {
            const filePath = join(dirPath, file);
            const content = readFileSync(filePath, 'utf-8');
            const data: OPRResponse = JSON.parse(content);

            const fileKey = `${version}/${file}`;
            this.dataMap.set(fileKey, data);

            const locationKey = this.buildLocationKey(data);
            this.locationIndex.set(locationKey, fileKey);
          } catch (e) {
            this.logger.error(`Failed to load ${join(dir, file)}:`, e.message);
          }
        }
      }

      this.logger.log(
        `Loaded ${this.dataMap.size} route(s) from ${versionDirs.length} ${label} version(s)`,
      );
    } catch (e) {
      this.logger.error(`Failed to load registry ${label}:`, e);
    }
  }

  private buildLocationKey(data: OPRResponse): string {
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    return [
      norm(data.island_group),
      norm(data.region_code),
      norm(data.province),
      norm(data.city),
    ].join('|');
  }

  // --- Public methods (unchanged) ---
  getByVersionAndFile(version: string, filename: string): OPRResponse | null {
    const key = `${version}/${filename}`;
    return this.dataMap.get(key) || null;
  }

  findByLocation(params: {
    islandGroup: string;
    regionCode: string;
    province: string;
    city: string;
  }): OPRResponse | null {
    const key = [
      params.islandGroup.toLowerCase().replace(/\s+/g, ''),
      params.regionCode.toLowerCase().replace(/\s+/g, ''),
      params.province.toLowerCase().replace(/\s+/g, ''),
      params.city.toLowerCase().replace(/\s+/g, ''),
    ].join('|');

    const fileKey = this.locationIndex.get(key);
    return fileKey ? this.dataMap.get(fileKey) || null : null;
  }

  getAllVersions(): string[] {
    const versions = new Set<string>();
    for (const key of this.dataMap.keys()) {
      const [version] = key.split('/');
      versions.add(version);
    }
    return Array.from(versions).sort((a, b) => Number(a) - Number(b));
  }

  listRoutesInVersion(version: string): string[] {
    const files: string[] = [];
    for (const key of this.dataMap.keys()) {
      if (key.startsWith(`${version}/`)) {
        files.push(key.split('/')[1]);
      }
    }
    return files;
  }
}
