import { loadProgramData } from "./data-loader.js";
import {
  initializeAirportMap,
  selectAirportMarker,
  setMapTheme,
  updateAirportMapVisibility
} from "./map.js";
import { getStoredTheme, setStoredTheme } from "./storage.js";
import {
  renderAirportDetail,
  renderAirportList,
  renderLoadError,
  renderRegions,
} from "./ui.js";

const elements = {
  airportDetail: document.querySelector("#airport-detail"),
  airportList: document.querySelector("#airport-list"),
  airportSearch: document.querySelector("#airport-search"),
  datasetVersion: document.querySelector("#dataset-version"),
  map: document.querySelector("#airport-map"),
  mapSummary: document.querySelector("#map-summary"),
  networkStatus: document.querySelector("#network-status"),
  regionFilter: document.querySelector("#region-filter"),
  resultCount: document.querySelector("#result-count"),
  themeToggle: document.querySelector("#theme-toggle")
};

const state = {
  activeRegionId: "all",
  airports: [],
  filteredAirports: [],
  regions: [],
  regionById: new Map(),
  searchTerm: "",
  selectedAirportId: null,
  version: null
};

initializeTheme();
initializeNetworkStatus();
registerServiceWorker();
initializeApp();

async function initializeApp() {
  try {
    const data = await loadProgramData();
    state.airports = data.airports;
    state.filteredAirports = data.airports;
    state.regions = data.regions;
    state.regionById = data.regionById;
    state.version = data.version;

    elements.datasetVersion.textContent = data.version.version;

    try {
      initializeAirportMap(elements.map, state.airports, state.regionById, selectAirport);
    } catch (mapError) {
      showMapError(mapError);
    }

    renderRegions(elements.regionFilter, state.regions, state.activeRegionId, setRegionFilter);

    if (state.airports.length > 0) {
      selectAirport(state.airports[0].id, { preserveList: true, pan: false });
    }

    applyFilters();
    attachEvents();
  } catch (error) {
    renderLoadError(elements.airportDetail, error);
    elements.datasetVersion.textContent = "Unavailable";
    elements.mapSummary.textContent = "Dataset failed to load";
  }
}

function showMapError(error) {
  elements.map.replaceChildren();
  const message = document.createElement("p");
  message.className = "load-error map-error";
  message.textContent = error.message;
  elements.map.append(message);
}

function attachEvents() {
  elements.airportSearch.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim().toLowerCase();
    applyFilters();
  });

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setStoredTheme(nextTheme);
  });
}

function setRegionFilter(regionId) {
  state.activeRegionId = regionId;
  renderRegions(elements.regionFilter, state.regions, state.activeRegionId, setRegionFilter);
  applyFilters();
}

function selectAirport(airportId, options = {}) {
  state.selectedAirportId = airportId;
  const airport = state.airports.find((item) => item.id === airportId);
  const region = airport ? state.regionById.get(airport.regionId) : null;
  renderAirportDetail(elements.airportDetail, airport, region);

  selectAirportMarker(state.selectedAirportId, { pan: options.pan !== false });

  if (!options.preserveList) {
    renderAirportList(elements.airportList, state.filteredAirports, state.regionById, state.selectedAirportId, selectAirport);
  }
}

function applyFilters() {
  state.filteredAirports = state.airports.filter((airport) => {
    const region = state.regionById.get(airport.regionId);
    const matchesRegion = state.activeRegionId === "all" || airport.regionId === state.activeRegionId;
    const haystack = [
      airport.displayName,
      airport.name,
      airport.faaId,
      airport.address,
      airport.status,
      airport.type,
      airport.stampLocation,
      region?.name,
      region?.shortName
    ].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = !state.searchTerm || haystack.includes(state.searchTerm);
    return matchesRegion && matchesSearch;
  });

  const visibleAirportIds = new Set(state.filteredAirports.map((airport) => airport.id));

  if (state.selectedAirportId && !visibleAirportIds.has(state.selectedAirportId)) {
    state.selectedAirportId = state.filteredAirports[0]?.id ?? null;
    const selectedAirport = state.airports.find((airport) => airport.id === state.selectedAirportId);
    renderAirportDetail(
      elements.airportDetail,
      selectedAirport,
      selectedAirport ? state.regionById.get(selectedAirport.regionId) : null
    );
  }

  updateAirportMapVisibility(visibleAirportIds, state.selectedAirportId);
  renderAirportList(elements.airportList, state.filteredAirports, state.regionById, state.selectedAirportId, selectAirport);
  elements.resultCount.textContent = `${state.filteredAirports.length} shown`;
  elements.mapSummary.textContent = `${state.airports.length} airports · ${state.regions.length} regions`;
}

function initializeTheme() {
  const storedTheme = getStoredTheme();
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(storedTheme || preferredTheme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  setMapTheme(theme);
}

function initializeNetworkStatus() {
  const update = () => {
    const online = navigator.onLine;
    elements.networkStatus.textContent = online ? "Online" : "Offline";
    elements.networkStatus.classList.toggle("online", online);
    elements.networkStatus.classList.toggle("offline", !online);
  };

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("service-worker.js");
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}
