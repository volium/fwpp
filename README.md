# FWPP

FWPP is an installable, offline-first web application for pilots participating in the Fly Washington Passport Program.

## Run Locally

From the repository root:

```sh
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

You can also use:

```sh
npx serve .
```

The Milestone 1 app is static and does not require a build step.

## Data

Airport and region reference data lives in `/data`.

- `/data/regions.json`
- `/data/airports.json`
- `/data/program-version.json`
- `/data/changelog.json`

Airport IDs are stable numbers. Airport names, FAA IDs, stamp locations, notes, and status may change over time without changing the airport ID.

## Import Airports From CSV

The official Google Maps export CSV files can be converted into the combined app dataset with:

```sh
python3 scripts/import_airports.py
```

The importer writes `/data/airports.json`, uses the CSV `Airport` field as `displayName`, preserves the CSV address as `address`, and assigns IDs by region:

- Northwest Region: `10xx`
- Olympic Region: `20xx`
- Southwest Region: `30xx`
- Eastern Region: `40xx`
- North Central: `50xx`
- South Central: `60xx`
- Seaplane Bases: `70xx`

## Milestone 1 Status

This foundation includes:

- Static PWA shell.
- Web app manifest.
- Service worker app/data caching.
- Offline-ready airport metadata after first successful load.
- Region-colored map markers.
- Airport detail panel.
- Region filtering and search.
- Light and dark themes.
