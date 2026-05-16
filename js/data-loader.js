const JSON_PATHS = {
  airports: "data/airports.json",
  regions: "data/regions.json",
  version: "data/program-version.json",
  changelog: "data/changelog.json"
};

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

export async function loadProgramData() {
  const [airports, regions, version, changelog] = await Promise.all([
    fetchJson(JSON_PATHS.airports),
    fetchJson(JSON_PATHS.regions),
    fetchJson(JSON_PATHS.version),
    fetchJson(JSON_PATHS.changelog)
  ]);

  const sortedRegions = [...regions].sort((a, b) => a.sortOrder - b.sortOrder);
  const regionById = new Map(sortedRegions.map((region) => [region.id, region]));
  const sortedAirports = [...airports].sort((a, b) => {
    const regionA = regionById.get(a.regionId)?.sortOrder ?? 999;
    const regionB = regionById.get(b.regionId)?.sortOrder ?? 999;
    return regionA - regionB || a.displayName.localeCompare(b.displayName);
  });

  return {
    airports: sortedAirports,
    regions: sortedRegions,
    regionById,
    version,
    changelog
  };
}
