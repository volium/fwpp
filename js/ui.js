import { formatCoordinates, projectAirport } from "./map.js";

export function renderRegions(container, regions, activeRegionId, onSelect) {
  container.replaceChildren();

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = `region-button ${activeRegionId === "all" ? "active" : ""}`;
  allButton.style.setProperty("--region-color", "var(--accent)");
  allButton.textContent = "All";
  allButton.addEventListener("click", () => onSelect("all"));
  container.append(allButton);

  for (const region of regions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `region-button ${activeRegionId === region.id ? "active" : ""}`;
    button.style.setProperty("--region-color", region.color);
    button.textContent = region.shortName;
    button.addEventListener("click", () => onSelect(region.id));
    container.append(button);
  }
}

export function renderMarkers(container, airports, regionById, selectedAirportId, onSelect) {
  container.replaceChildren();

  for (const airport of airports) {
    const region = regionById.get(airport.regionId);
    const position = projectAirport(airport);
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = [
      "marker",
      airport.type === "seaplane_base" ? "seaplane" : "",
      selectedAirportId === airport.id ? "is-selected" : ""
    ].filter(Boolean).join(" ");
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.style.setProperty("--region-color", region?.color ?? "var(--accent)");
    marker.setAttribute("aria-label", `${airport.displayName}, ${region?.name ?? "Unknown region"}`);
    marker.title = airport.displayName;
    marker.dataset.airportId = String(airport.id);
    marker.addEventListener("click", () => onSelect(airport.id));
    container.append(marker);
  }
}

export function updateMarkerVisibility(container, visibleAirportIds, selectedAirportId) {
  for (const marker of container.querySelectorAll(".marker")) {
    const airportId = Number(marker.dataset.airportId);
    marker.classList.toggle("is-hidden", !visibleAirportIds.has(airportId));
    marker.classList.toggle("is-selected", selectedAirportId === airportId);
  }
}

export function renderAirportList(container, airports, regionById, selectedAirportId, onSelect) {
  container.replaceChildren();

  if (airports.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No airports match the current filters.";
    container.append(empty);
    return;
  }

  for (const airport of airports) {
    const region = regionById.get(airport.regionId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `airport-card ${selectedAirportId === airport.id ? "is-selected" : ""}`;
    button.style.setProperty("--region-color", region?.color ?? "var(--accent)");
    button.addEventListener("click", () => onSelect(airport.id));

    const title = document.createElement("div");
    title.className = "airport-card-title";

    const name = document.createElement("span");
    name.textContent = airport.displayName;

    const dot = document.createElement("span");
    dot.className = "region-dot";
    dot.setAttribute("aria-hidden", "true");

    const meta = document.createElement("div");
    meta.className = "airport-card-meta";
    meta.append(
      textSpan(region?.shortName ?? "Unknown region"),
      textSpan(airport.type === "seaplane_base" ? "Seaplane" : "Airport"),
      textSpan(airport.status)
    );

    title.append(name, dot);
    button.append(title, meta);
    container.append(button);
  }
}

export function renderAirportDetail(container, airport, region) {
  container.replaceChildren();

  if (!airport) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Select an airport marker or list item to view stamp details.";
    container.append(empty);
    return;
  }

  const title = document.createElement("h3");
  title.textContent = airport.displayName;

  const meta = document.createElement("div");
  meta.className = "detail-meta";
  meta.append(
    chip(region?.name ?? "Unknown region"),
    chip(airport.type === "seaplane_base" ? "Seaplane base" : "Airport"),
    chip(statusLabel(airport.status)),
    chip(formatCoordinates(airport))
  );

  container.append(title, meta);
  if (airport.address) {
    container.append(detailBlock("Address", airport.address));
  }
  container.append(detailBlock("Stamp Location", airport.stampLocation || "Not yet documented."));

  if (airport.notes) {
    container.append(detailBlock("Notes", airport.notes));
  }

  if (airport.aliases?.length) {
    container.append(detailBlock("Aliases", airport.aliases.join(", ")));
  }

  if (airport.links?.length) {
    const block = document.createElement("div");
    block.className = "detail-block";
    const label = document.createElement("strong");
    label.textContent = "Links";
    block.append(label);

    for (const link of airport.links) {
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = link.label;
      block.append(anchor);
    }

    container.append(block);
  }
}

export function renderLoadError(container, error) {
  container.replaceChildren();
  const message = document.createElement("p");
  message.className = "load-error";
  message.textContent = `Unable to load airport data. ${error.message}`;
  container.append(message);
}

function chip(value) {
  const span = document.createElement("span");
  span.className = "detail-chip";
  span.textContent = value;
  return span;
}

function detailBlock(labelText, value) {
  const block = document.createElement("div");
  block.className = "detail-block";

  const label = document.createElement("strong");
  label.textContent = labelText;

  const body = document.createElement("p");
  body.textContent = value;

  block.append(label, body);
  return block;
}

function statusLabel(status) {
  return status.replaceAll("_", " ");
}

function textSpan(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span;
}
