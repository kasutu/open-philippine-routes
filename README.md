<p align="center">
  <a href="#" target="_blank">
    <img src="logo-mid.svg" width="120" alt="opr Logo" />
  </a>
</p>

<h align="center">
 <h1>Open Philippine Routes (OPR)</h1>
</h>
<p align="center">
  A community-maintained dataset of public utility vehicle (PUV) routes across the Philippines
</p>

<!-- <p align="center">

  <a href="https://circleci.com/gh/nestjs/nest" target="_blank">
    <img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" />
  </a>

</p> -->

## Description

Open Philippine Routes (OPR) is an open-source API built with NestJS that provides a standardized, immutable, and community-maintained dataset of public utility vehicle (PUV) routes across the Philippines. The system is designed to address the fragmented and often informal nature of Philippine public transport data by offering a simple, waypoint-based model stored in static JSON files.

Features:

- Generic & Latest route records in the Philippine
- Immutability of published data versions
- Full backward compatibility for API consumers

**Quick Start**  
Fetch route data using dynamic URI parameters:

```http
GET /:version/:city
```

**Example:**

```bash
curl https://useopr.onrender.com/v1/iloilo-city
```

```json
{
  "country": "Philippines",
  "country_code": "PH",
  "island_group": "Visayas",
  "region": "Region 06",
  "region_code": "06",
  "province": "Iloilo",
  "province_code": "XX",
  "city": "Iloilo City",
  "city_type": "municipality",
  "postal_code": "0000",
  "latitude": 0,
  "longitude": 0,
  "routes": [
    {
      "route_code": "01",
      "name": "New Route",
      "waypoints": [
        {
          "sequence": 1,
          "sub_locality": "Barangay TBD",
          "sub_locality_type": "barangay",
          "street": "Main St",
          "destination": "Terminal",
          "latitude": 0,
          "longitude": 0
        }
      ]
    }
  ]
}
```

# Current Progress

Release: `v0`

- [x] add cli tooling for drafting, validating, and publishing
- [x] enable service to query in prod and dev via in memory mapping of files

# Contributing

**Anatomy**
io-centric record management for versioned immutable records.

- versioned endpoints, uri version gets incremented if the schema changes.
- file based version management
- route records should be unmodifiable after its committed in the registry

## Project setup

1. **Fork & clone** the repo.

   ```
   git clone https://github.com/kasutu/open-philippine-routes.git
   ```

   Install dependencies

   ```bash
   bun install
   ```

2. **Create a draft**:

   ```sh
   bun run registry draft
   ```

   > Follow prompts for version and location.

3. **Manually add real route data**
   Replace the placeholder in the generated `.json` file with **actual routes and waypoints** (sequence, barangay, street, coords, etc.).

4. **Validate**:

   ```sh
   bun run registry validate
   ```

   > Fix errors until it passes.

5. **Commit & PR**:
   - Push your `src/next/vN/` changes.
   - Open a PR titled: `feat(registry): draft vN – Province, City`

6. **Publishing**
   Done by maintainers **after merge**—never publish in a PR.

   > Drafts: `src/next/`
   > Never edit `src/data/`
   > One file per city

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

```

```

```

```
