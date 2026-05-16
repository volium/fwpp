const WASHINGTON_BOUNDS = {
  minLon: -125,
  maxLon: -116.85,
  minLat: 45.45,
  maxLat: 49.1
};

export function projectAirport(airport) {
  const xRatio = (airport.longitude - WASHINGTON_BOUNDS.minLon) / (WASHINGTON_BOUNDS.maxLon - WASHINGTON_BOUNDS.minLon);
  const yRatio = (WASHINGTON_BOUNDS.maxLat - airport.latitude) / (WASHINGTON_BOUNDS.maxLat - WASHINGTON_BOUNDS.minLat);
  return {
    x: clamp(xRatio * 100, 2, 98),
    y: clamp(yRatio * 100, 2, 98)
  };
}

export function formatCoordinates(airport) {
  return `${airport.latitude.toFixed(5)}, ${airport.longitude.toFixed(5)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
