import addFormats from 'ajv-formats';
import Ajv from 'ajv';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { City } from '@registry/registry/schema/schema';
import { Command } from 'commander';

const program = new Command();

program
  .name('registry')
  .description('CLI to manage route registry library')
  .version('1.0.0');

program
  .command('draft')
  .alias('d')
  .description('Create a new draft version')
  .action(async () => {
    // 1. Get version number
    const { version: initialVersion } = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        message: 'Enter draft version (non-negative integer):',
        validate: (input: string) =>
          /^\d+$/.test(input) ||
          'Version must be a non-negative integer (e.g., 0, 1, 42)',
      },
    ]);

    let versionToUse = parseInt(initialVersion, 10);

    // 2. Check if version exists in PUBLISHED location (src/data)
    const publishedPath = path.join(
      process.cwd(),
      `libs/registry/src/data/v${versionToUse}`,
    );

    if (await fs.pathExists(publishedPath)) {
      console.log(
        `\n❌ Version ${versionToUse} is already published at ${path.relative(process.cwd(), publishedPath)}`,
      );

      // Find next available version
      let nextVersion: number | null = null;
      for (let offset = 1; offset <= 10; offset++) {
        const candidate = (versionToUse + offset) % 10;
        const candidatePublishedPath = path.join(
          process.cwd(),
          `libs/registry/src/data/v${candidate}`,
        );

        if (!(await fs.pathExists(candidatePublishedPath))) {
          nextVersion = candidate;
          break;
        }
      }

      if (nextVersion === null) {
        console.error(
          '❌ All versions (0-9) are already published. Cannot create new draft.',
        );
        process.exit(1);
      }

      const { useNext } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useNext',
          message: `Suggest using version ${nextVersion} instead. Proceed?`,
          default: true,
        },
      ]);

      if (!useNext) {
        console.log('Draft creation cancelled');
        process.exit(0);
      }

      versionToUse = nextVersion;
      console.log(`✅ Using suggested version: ${versionToUse}`);
    }

    // 3. Set draft path with validated version
    const draftPath = path.join(
      process.cwd(),
      `libs/registry/src/next/v${versionToUse}`,
    );

    // 4. Handle existing DRAFTS (src/next)
    if (await fs.pathExists(draftPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Draft v${versionToUse} already exists at ${path.relative(process.cwd(), draftPath)}. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log('Draft creation cancelled');
        process.exit(0);
      }
      await fs.remove(draftPath);
    }

    await fs.ensureDir(draftPath);

    // 5. Copy and rename schema
    const schemaSource = path.join(
      process.cwd(),
      'libs/registry/src/schema/next.schema.json',
    );

    const schemaDest = path.join(draftPath, `v${versionToUse}.schema.json`);
    await fs.copy(schemaSource, schemaDest);

    // 6. Get location details for filename
    const { island_group, region_code, province, city } = await inquirer.prompt(
      [
        {
          type: 'list',
          name: 'island_group',
          message: 'Select island group:',
          choices: ['Luzon', 'Visayas', 'Mindanao'],
        },
        {
          type: 'input',
          name: 'region_code',
          message: 'Enter region code (e.g., 06):',
          validate: (input: string) =>
            /^\d{2}$/.test(input) || 'Must be 2-digit region code',
        },
        {
          type: 'input',
          name: 'province',
          message: 'Enter province name (e.g., Iloilo):',
          validate: (input: string) => !!input.trim() || 'Required',
        },
        {
          type: 'input',
          name: 'city',
          message: 'Enter city/municipality (e.g., Iloilo City):',
          validate: (input: string) => !!input.trim() || 'Required',
        },
      ],
    );

    // 7. Generate filename with hyphenated spaces
    const sanitized = (str: string) =>
      str
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
        .replace(/-+/g, '-') // Collapse multiple hyphens
        .replace(/^-+|-+$/g, ''); // Trim edge hyphens

    const fileName = `${sanitized(island_group)}_region-${region_code}_${sanitized(province)}_${sanitized(city)}.json`;
    const filePath = path.join(draftPath, fileName);

    // 8. Create minimal valid JSON structure
    const minimalData: City = {
      country: 'Philippines' as const,
      country_code: 'PH' as const,
      island_group: island_group as 'Luzon' | 'Visayas' | 'Mindanao',
      region: `Region ${region_code}`,
      region_code,
      province,
      province_code: 'XX', // Placeholder
      city,
      city_type: 'municipality' as const,
      postal_code: '0000',
      latitude: 0,
      longitude: 0,
      routes: [
        {
          route_code: '01',
          name: 'New Route',
          waypoints: [
            {
              sequence: 1,
              sub_locality: 'Barangay TBD',
              sub_locality_type: 'barangay' as const,
              street: 'Main St',
              destination: ['Terminal', 'Robinsons'],
              latitude: 0,
              longitude: 0,
            },
          ],
        },
      ],
    };

    await fs.writeJson(filePath, minimalData, { spaces: 2 });

    console.log(`\n✅ Draft created successfully!`);
    console.log(`📁 Location: ${path.relative(process.cwd(), draftPath)}`);
    console.log(`	Schema: v${versionToUse}.schema.json`);
    console.log(`	Data file: ${fileName}`);
    console.log(`\n📝 Next steps:`);
    console.log(`1. Edit ${fileName} with actual route data`);
    console.log(`2. Validate against schema before publishing`);
    console.log(`3. Move to src/data when ready to publish`);
  });

program
  .command('validate')
  .alias('a')
  .description('Validate all draft versions')
  .action(async () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);

    const nextDir = path.join(process.cwd(), 'libs', 'registry', 'src', 'next');

    if (!(await fs.pathExists(nextDir))) {
      console.log('✅ No drafts to validate (src/next/ does not exist)');
      return;
    }

    const entries = await fs.readdir(nextDir, { withFileTypes: true });
    const versionDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => /^v\d+$/.test(name)); // ✅ Matches v0, v1, v123, etc.

    if (versionDirs.length === 0) {
      console.log('✅ No versioned draft directories found in src/next/');
      return;
    }

    let hasError = false;

    for (const dirName of versionDirs) {
      const match = dirName.match(/^v(\d+)$/);
      if (!match) continue; // defensive (shouldn't happen)

      const versionNumber = match[1]; // e.g., "0", "12"
      const dirPath = path.join(nextDir, dirName);
      const schemaFileName = `v${versionNumber}.schema.json`;
      const schemaPath = path.join(dirPath, schemaFileName);

      if (!(await fs.pathExists(schemaPath))) {
        console.log(`❌ ${dirName}: missing schema file "${schemaFileName}"`);
        hasError = true;
        continue;
      }

      let schema;
      try {
        schema = await fs.readJson(schemaPath);
      } catch (e) {
        console.log(`❌ ${dirName}: failed to parse schema JSON`);
        hasError = true;
        continue;
      }

      let validate;
      try {
        validate = ajv.compile(schema);
      } catch (e) {
        console.log(`❌ ${dirName}: invalid schema`);
        hasError = true;
        continue;
      }

      const files = (await fs.readdir(dirPath)).filter(
        (file) =>
          file.endsWith('.json') &&
          file !== schemaFileName &&
          // Optional: skip hidden/temp files
          !file.startsWith('.'),
      );

      if (files.length === 0) {
        console.log(`ℹ️  ${dirName}: no data files to validate`);
        continue;
      }

      let versionValid = true;
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const data = await fs.readJson(filePath);
          const valid = validate(data);
          if (!valid) {
            console.log(`\n❌ ${dirName}/${file}: INVALID`);
            if (validate.errors) {
              for (const err of validate.errors) {
                console.log(`   ${err.instancePath || '/'}: ${err.message}`);
              }
            }
            versionValid = false;
            hasError = true;
          }
        } catch (e) {
          console.log(`\n❌ ${dirName}/${file}: NOT VALID JSON`);
          versionValid = false;
          hasError = true;
        }
      }

      if (versionValid) {
        console.log(`✅ ${dirName}: ${files.length} file(s) valid`);
      }
    }

    console.log(
      '\n' + (hasError ? '❌ Validation failed' : '✅ All drafts valid'),
    );
    if (hasError) process.exit(1);
  });

program
  .command('pub')
  .alias('p')
  .description('Publish a draft version')
  .argument('<version>', 'Version number (e.g., 0, 5, 12)')
  .action(async (version: string) => {
    // Validate version is digits-only
    if (!/^\d+$/.test(version)) {
      console.error(
        '❌ Version must be a non-negative integer (e.g., 0, 1, 42)',
      );
      process.exit(1);
    }

    const nextDir = path.join(process.cwd(), 'libs', 'registry', 'src', 'next');
    const dataDir = path.join(process.cwd(), 'libs', 'registry', 'src', 'data');

    const draftDir = path.join(nextDir, `v${version}`);
    const publishDir = path.join(dataDir, `v${version}`);

    // 1. Check draft exists
    if (!(await fs.pathExists(draftDir))) {
      console.error(
        `❌ Draft not found: ${path.relative(process.cwd(), draftDir)}`,
      );
      process.exit(1);
    }

    // 2. Check publish target does NOT exist
    if (await fs.pathExists(publishDir)) {
      console.error(`❌ Version v${version} is already published.`);
      console.error(`   Location: ${path.relative(process.cwd(), publishDir)}`);
      console.error('');
      console.error(
        `⚠️  Published versions are IMMUTABLE to prevent breaking clients.`,
      );
      console.error(
        `💡 To release changes, create and publish a NEW version (e.g., v${Number(version) + 1}).`,
      );
      process.exit(1);
    }

    // 3. Ensure data directory exists
    await fs.ensureDir(dataDir);

    // 4. Copy draft to data
    await fs.copy(draftDir, publishDir);

    console.log(`✅ Published v${version}!`);
    console.log(`📁 Source: ${path.relative(process.cwd(), draftDir)}`);
    console.log(`➡️  Target: ${path.relative(process.cwd(), publishDir)}`);
    console.log(`\n💡 Remember to commit this change!`);
  });

program.parse();
