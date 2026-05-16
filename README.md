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

