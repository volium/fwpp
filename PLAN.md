# FWPP Development Plan

FWPP stands for "Fly Washington Passport Program". This project is an installable, offline-first web application for pilots participating in the Fly Washington Passport Program.

The app should help pilots visualize participating airports, understand regional groupings, track collected stamps, record visit details, and eventually plan efficient stamp-collecting flights. It must work well on phones, tablets, and desktop, including in places with unreliable or unavailable network coverage.

This document is intended to be implementation-ready for a human developer or AI coding agent.

## Product Principles

- Offline-first: the core airport dataset, region metadata, and user progress must be usable without a network connection.
- Map-first: the primary experience should make visited/unvisited airports and regions obvious at a glance.
- Installable: the app must be a valid PWA with manifest, service worker, icons, and an app-like mobile experience.
- Static-host friendly: the app must run from static hosting such as GitHub Pages.
- Local-test friendly: during early development, the app must run with either `python3 -m http.server 8000` or `npx serve .`.
- Versioned public data: airport and region definitions must live in the repository and be easy to update through normal Git changes.
- Local user ownership: user progress should be stored locally first, with later support for Google sign-in and Google Drive sync.
- Light and dark modes: the UI and map style should support both.
- Accessible and fast: the app should be usable in daylight, cockpit-like tablet use, desktop planning, and low-connectivity environments.

## Local Development Constraint

The first implementation should not require a Node dev server, bundler dev server, API server, or server-side rendering to view the app locally.

The app must be testable from the repository root with:

```sh
python3 -m http.server 8000
```

or:

```sh
npx serve .
```

Then open:

```text
http://localhost:8000
```

or the URL printed by `npx serve`.

This means the initial architecture should be plain static files or a build output committed/generated into a static directory. If a build tool is introduced later, the generated app must still be runnable as static assets.

## Proposed Initial Repository Structure

```text
/
  index.html
  manifest.webmanifest
  service-worker.js
  PLAN.md
  README.md
  /assets
    /icons
    /screenshots
  /css
    app.css
  /js
    app.js
    data-loader.js
    map.js
    storage.js
    ui.js
  /data
    airports.json
    regions.json
    program-version.json
    changelog.json
```

This structure keeps Milestone 1 simple and compatible with static servers. A later milestone may migrate to TypeScript, Vite, React, Svelte, or another framework, but only after the core data and offline behavior are proven.

## Data Model

Separate public program reference data from private user progress data.

### Public Data

Public data is committed to the repo under `/data`.

#### `regions.json`

Each region should have a stable ID, display name, map color, and sort order.

```json
[
  {
    "id": "olympic",
    "name": "Olympic Region",
    "shortName": "Olympic",
    "color": "#2563eb",
    "sortOrder": 10
  }
]
```

Required regions:

- `olympic`
- `southwest`
- `northwest`
- `north-central`
- `south-central`
- `eastern`
- `seaplane-bases`

#### `airports.json`

Each airport or seaplane base must have a stable numeric ID that does not change when the display name, FAA ID, or other metadata changes.

```json
[
  {
    "id": 1001,
    "faaId": "ESW",
    "name": "Easton",
    "displayName": "Easton (ESW)",
    "type": "airport",
    "regionId": "south-central",
    "address": "",
    "latitude": 47.2541839,
    "longitude": -121.1855317,
    "stampLocation": "Stamp is located inside a blue lock box mounted on the visitor information sign. The lock combo is the airport CTAF.",
    "status": "active",
    "effectiveFrom": "2026-01-01",
    "effectiveTo": null,
    "aliases": [],
    "links": [
      {
        "label": "WSDOT Airport Page",
        "url": "https://wsdot.wa.gov/travel/aviation/airports-list/easton-state"
      }
    ],
    "notes": ""
  }
]
```

Required fields:

- `id`
- `name`
- `displayName`
- `type`
- `regionId`
- `latitude`
- `longitude`
- `stampLocation`
- `status`
- `effectiveFrom`

Optional fields:

- `faaId`
- `aliases`
- `address`
- `links`
- `notes`
- `effectiveTo`

Valid `type` values:

- `airport`
- `seaplane_base`

Valid `status` values:

- `active`
- `retired`
- `temporarily_unavailable`

Important rule: do not delete airports from the dataset when they leave the program. Mark them as `retired` with `effectiveTo` so historical user progress can still be understood.

Airport IDs are numeric because they are public dataset identifiers that should remain short, stable, and decoupled from mutable airport names or codes. User-generated records such as visits, rounds, photos, and sync records may still use UUID strings.

#### `program-version.json`

```json
{
  "version": "2026.05.01",
  "publishedAt": "2026-05-01",
  "source": "Manual dataset based on Fly Washington Passport Program public information",
  "notes": "Initial dataset"
}
```

#### `changelog.json`

Use this for data updates that affect users.

```json
[
  {
    "version": "2026.05.01",
    "date": "2026-05-01",
    "changes": [
      {
        "type": "added",
        "airportId": 1001,
        "summary": "Added Easton (ESW)."
      }
    ]
  }
]
```

## User Data Model

User data should not be mixed into `/data`. It should live in browser storage first. Use IndexedDB once user progress is introduced.

### Visit

```json
{
  "id": "uuid",
  "airportId": 1001,
  "roundId": "round-1",
  "visitedAt": "2026-05-15T18:30:00-07:00",
  "stampCollected": true,
  "aircraftTailNumber": "N12345",
  "notes": "Stamp found in blue lock box.",
  "photoIds": [],
  "createdAt": "2026-05-15T18:35:00-07:00",
  "updatedAt": "2026-05-15T18:35:00-07:00"
}
```

### Round

Use "round" in the app to represent repeated attempts at completing the full program. The official program refers to repeat completions as Master Aviator chevrons, so the UI can say things like "Round 2" and "Master Aviator chevron progress".

```json
{
  "id": "round-1",
  "name": "Round 1",
  "startedAt": "2026-05-15T00:00:00-07:00",
  "completedAt": null,
  "programVersionAtStart": "2026.05.01"
}
```

## Milestone 1: Installable PWA Shell and Offline Airport Visualization

Goal: users can install the app, open it offline, and visualize the airport dataset with regions and metadata.

### Scope

- Static app shell.
- PWA manifest.
- Service worker for app shell and data caching.
- Region dataset.
- Airport dataset.
- Map-centered UI.
- Airport markers colored by region.
- Airport detail panel or sheet with metadata.
- Light/dark theme support.
- Basic region filter.
- Offline access to app shell and airport metadata after first load.

### Requirements

- The app must load from `python3 -m http.server 8000`.
- The app must load from `npx serve .`.
- The app must not require build steps for Milestone 1.
- The app must still show airport data if the network is unavailable after the first successful load.
- The app must handle failed data fetches gracefully.
- The app must show the current dataset version somewhere in settings, about, or a compact footer.

### Map Requirements

- Use a map of Washington State as the primary screen.
- Airport markers must encode region.
- Seaplane bases must be visually distinguishable from land airports.
- Clicking or tapping a marker must show:
  - Airport display name
  - Region
  - Coordinates
  - Stamp location
  - Status
  - Links, if available
  - Notes, if available
- The map must have a reasonable initial viewport covering Washington State.

### Basemap Strategy

For Milestone 1, prefer a simple implementation that works locally and degrades well.

Acceptable options:

- Online raster/vector basemap with cached app data, plus clear offline fallback.
- Static Washington outline or simplified canvas/SVG background with airport markers.
- MapLibre GL JS with online tiles initially, then offline tile support later.

Do not block Milestone 1 on perfect offline basemap tiles. The airport coordinates and metadata are the essential offline data.

### Deliverables

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `/data/regions.json`
- `/data/airports.json`
- `/data/program-version.json`
- `/data/changelog.json`
- App JavaScript and CSS.
- At least a small seed airport dataset for development.
- README instructions for local serving.

### Acceptance Criteria

- Running `python3 -m http.server 8000` serves the app successfully.
- Running `npx serve .` serves the app successfully.
- Browser install prompt is available where supported.
- App reloads without network after one online load.
- Airport markers appear.
- Regions are visually distinguishable.
- Airport metadata is visible from the UI.
- Light and dark modes are usable.

## Milestone 2: Visit Tracking

Goal: users can mark airports as visited and record useful visit details.

### Scope

- Local persistence for visits.
- Mark airport visited/unvisited for the active round.
- Add/edit/delete visit records.
- Record visit date/time.
- Record aircraft tail number.
- Record notes.
- Optional `stampCollected` flag.
- Basic visit history on airport detail.
- Visited/unvisited marker styling.

### Requirements

- Use IndexedDB for structured local persistence.
- Do not require sign-in.
- Do not require network access.
- User progress must survive page reloads and app restarts.
- Provide a JSON export/import backup mechanism if feasible in this milestone.

### Acceptance Criteria

- A user can mark Easton or any seed airport as visited.
- The marker changes state immediately.
- The visit appears in that airport's detail view.
- The visit remains after reload.
- The user can edit or delete the visit.
- The app works while offline.

## Milestone 3: Progress Tracking

Goal: users can see total and regional progress for the active round.

### Scope

- Total active-program progress.
- Progress by region.
- Separate seaplane base progress.
- Current round summary.
- Progress UI on dashboard or side panel.
- Filters for visited/unvisited/region.

### Requirements

- Progress must be calculated from the public dataset and local visits.
- Retired airports should not break progress calculation.
- If an airport was visited before retirement, the UI should preserve that historical fact.
- Progress logic must be covered by unit tests once a test framework exists.

### Acceptance Criteria

- Total progress updates after marking a visit.
- Region progress updates after marking a visit.
- Seaplane bases are tracked separately.
- Filtering the map by unvisited airports works.
- Progress remains correct after reload.

## Milestone 4: Rounds and Repeat Completions

Goal: users can track multiple completions of the program.

### Scope

- Create new round.
- Rename round.
- Switch active round.
- View completed rounds.
- Track airport visits per round.
- Show Master Aviator chevron count or progress.

### Requirements

- Each visit belongs to a round.
- The app should default to `Round 1`.
- Starting a new round should not erase prior progress.
- The user should be able to see all-time visited airports separately from current-round progress.

### Acceptance Criteria

- User can complete progress in Round 1, start Round 2, and see fresh progress.
- Prior visits remain visible in history.
- Map can show current-round state and all-time state.

## Milestone 5: Google Sign-In and Google Drive Sync

Goal: users can sync progress across devices while keeping data user-owned.

### Scope

- Google sign-in.
- Google Drive API integration.
- Store app data in Google Drive `appDataFolder`.
- Sync visits, rounds, settings, and later photo metadata.
- Manual sync trigger.
- Automatic sync when online.
- Conflict handling.

### Requirements

- App must remain usable without sign-in.
- Local data is the source of immediate UI truth.
- Sync must never silently delete local user data.
- Use stable IDs and `updatedAt` timestamps for conflict resolution.
- Provide export/import even after Drive sync is added.

### Acceptance Criteria

- User can sign in with Google.
- User can sync local progress to Drive.
- User can load progress on another browser/device after sign-in.
- Offline edits sync when connectivity returns.

## Milestone 6: Photos and Evidence

Goal: users can attach photos to visits.

### Scope

- Add photo to visit.
- Store local thumbnails.
- Store photo metadata.
- Sync photos to Google Drive.
- View photos in airport detail and visit history.

### Requirements

- Compress or resize photos before storage when appropriate.
- Preserve enough quality for stamp evidence.
- Avoid blocking the app on photo upload.
- Handle upload failures clearly.

### Acceptance Criteria

- User can attach a photo to a visit.
- Photo appears after reload.
- Photo syncs to Drive when signed in.
- App remains responsive during upload.

## Milestone 7: Planning Tools

Goal: users can plan stamp-collecting flights more easily.

### Scope

- Show unvisited airports by region.
- Select airports for a planned run.
- Basic distance estimates.
- Route ordering assistance.
- Export selected airports as a list.
- Optional external navigation/planning links.

### Requirements

- Planning must work with offline airport metadata.
- Make no assumptions that route output is flight-safe or regulatory guidance.
- UI should be clear that pilots must use official aviation planning tools for actual navigation, weather, NOTAMs, airspace, fuel, and performance decisions.

### Acceptance Criteria

- User can select unvisited airports for a run.
- App shows approximate route distance.
- User can save or export the plan.

## Milestone 8: Dataset Maintenance Workflow

Goal: make updates to the airport dataset easy and safe.

### Scope

- Data validation script.
- Schema documentation.
- Changelog requirement.
- Duplicate ID detection.
- Coordinate validation.
- Region ID validation.
- Status/effective date validation.

### Requirements

- Dataset changes should be reviewed in Git.
- Validation should catch common mistakes before publishing.
- Airports should be retired, not deleted.
- Name changes should preserve stable IDs and use `aliases`.

### Acceptance Criteria

- Running validation catches invalid region IDs.
- Running validation catches missing required fields.
- Running validation catches duplicate airport IDs.
- A developer can add, retire, or rename an airport by editing JSON.

## Technical Notes

### PWA

- `manifest.webmanifest` should include app name, short name, icons, theme colors, display mode, and start URL.
- `service-worker.js` should precache the app shell and `/data` files.
- Use cache version names that include app/data version where practical.
- Provide an update path when new app or data versions are available.

### Storage

Milestone 1 can use fetch plus Cache Storage.

Milestone 2 and later should use IndexedDB. A helper library such as Dexie may be introduced, but it must be compatible with static hosting.

### Maps

MapLibre GL JS is a good long-term map choice. If used, keep the map code isolated so the app can later support offline tiles through PMTiles or a similar approach.

Potential basemap styles:

- Positron for clean light mode.
- Voyager for balanced detail.
- Light Gray + Labels for low-clutter light mode.
- Dark Gray + Labels for dark mode.

For early milestones, the app may use online basemap tiles while keeping airport data offline. Later milestones should investigate offline Washington-focused map tiles.

### Accessibility

- Do not rely on color alone to distinguish visited/unvisited or region.
- Marker states should use shape, fill, icon, or stroke differences.
- Touch targets should be usable on phones and tablets.
- Airport detail sheets should be keyboard accessible.
- Theme colors should meet reasonable contrast targets.

### Safety and Disclaimer

FWPP is a tracking and planning aid, not an official source for aviation safety decisions.

The app should eventually include a concise disclaimer that pilots must verify airport status, weather, NOTAMs, airspace, fuel, runway conditions, and all flight safety information using official aviation sources.

## Suggested Implementation Order

1. Create static PWA shell.
2. Add app manifest and icons.
3. Add service worker with app shell caching.
4. Define `regions.json`.
5. Define seed `airports.json`.
6. Load data into the UI.
7. Render map and markers.
8. Add airport detail panel.
9. Add region filter and theme toggle.
10. Verify local serving with Python and `npx serve`.
11. Verify offline reload after first load.
12. Add local visit persistence.
13. Add progress calculations.
14. Add rounds.
15. Add sync and advanced features.

## Questions To Resolve Before Milestone 2

- Should "visited" mean the pilot landed, collected the stamp, or both?
- Should a visit support multiple aircraft tail numbers or only one?
- Should stamp collection be separate from airport visit?
- Should users be able to track multiple pilots/passports on one device?
- Should the app support manual airport entries for non-program flights?

## Questions To Resolve Before Google Drive Sync

- Should photos be stored in Drive `appDataFolder`, a visible Drive folder, or both?
- Should sync be automatic, manual, or both?
- What should happen if two devices edit the same visit before syncing?
- Should the app support account switching?

## Definition of Done For Milestone 1

Milestone 1 is done when a developer can clone the repository, run one of the supported static servers, open the app, install it where supported, view the Washington airport map, inspect region-colored airport metadata, reload offline after first load, and understand how to update the airport dataset from files in `/data`.
