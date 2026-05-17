const WASHINGTON_BOUNDS = [
  [45.45, -125],
  [49.1, -116.85]
];

const TILE_LAYERS = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }
};

let map;
let currentTileLayer;
let markerLayer;
let currentTheme = "light";
const markerByAirportId = new Map();

export function initializeAirportMap(container, airports, regionById, onSelect) {
  if (!window.L) {
    throw new Error("Leaflet failed to load. Check your network connection and reload the app.");
  }

  map = L.map(container, {
    attributionControl: true,
    maxBounds: [
      [44.8, -126.4],
      [49.6, -115.4]
    ],
    maxBoundsViscosity: 0.45,
    minZoom: 6,
    zoomControl: true
  });

  markerLayer = L.layerGroup().addTo(map);
  setMapTheme(document.documentElement.dataset.theme || currentTheme);
  map.fitBounds(WASHINGTON_BOUNDS, { padding: [18, 18] });

  for (const airport of airports) {
    const region = regionById.get(airport.regionId);
    const marker = L.marker([airport.latitude, airport.longitude], {
      icon: createAirportIcon(airport),
      keyboard: true,
      title: airport.displayName
    });

    marker.on("click", () => onSelect(airport.id));
    marker.bindTooltip(`${airport.displayName}<br>${region?.name ?? "Unknown region"}`, {
      direction: "top",
      opacity: 0.96,
      sticky: true
    });
    marker.on("add", () => styleMarkerElement(marker, airport, region));
    marker.addTo(markerLayer);
    markerByAirportId.set(airport.id, marker);
  }
}

export function updateAirportMapVisibility(visibleAirportIds, selectedAirportId) {
  if (!markerLayer) {
    return;
  }

  for (const [airportId, marker] of markerByAirportId) {
    const shouldShow = visibleAirportIds.has(airportId);
    const isShown = markerLayer.hasLayer(marker);

    if (shouldShow && !isShown) {
      marker.addTo(markerLayer);
    } else if (!shouldShow && isShown) {
      markerLayer.removeLayer(marker);
    }
  }

  selectAirportMarker(selectedAirportId, { pan: false });
}

export function selectAirportMarker(airportId, options = {}) {
  for (const [currentAirportId, marker] of markerByAirportId) {
    const element = marker.getElement();
    if (element) {
      element.classList.toggle("is-selected", currentAirportId === airportId);
    }
  }

  const selectedMarker = markerByAirportId.get(airportId);
  if (selectedMarker && options.pan !== false && map) {
    map.panTo(selectedMarker.getLatLng(), { animate: true, duration: 0.35 });
  }
}

export function setMapTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";

  if (!map || !window.L) {
    return;
  }

  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  const layerConfig = TILE_LAYERS[currentTheme];
  currentTileLayer = L.tileLayer(layerConfig.url, {
    attribution: layerConfig.attribution,
    maxZoom: 19,
    subdomains: "abcd"
  }).addTo(map);
}

export function formatCoordinates(airport) {
  return `${airport.latitude.toFixed(5)}, ${airport.longitude.toFixed(5)}`;
}

function createAirportIcon(airport) {
  return L.divIcon({
    className: `airport-map-marker ${airport.type === "seaplane_base" ? "seaplane" : ""}`,
    html: "<span></span>",
    iconAnchor: [11, 11],
    iconSize: [22, 22],
    popupAnchor: [0, -12]
  });
}

function styleMarkerElement(marker, airport, region) {
  const element = marker.getElement();
  if (!element) {
    return;
  }

  element.style.setProperty("--region-color", region?.color ?? "var(--accent)");
  element.dataset.airportId = String(airport.id);
}
