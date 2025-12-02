import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  SOURCE_OPTIONS,
  SOURCE_COLORS,
  CATEGORY_COLOR_PALETTE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  SF_BOUNDS,
  parseDateSafely,
  formatDisplayDate,
  getSourceLabel,
} from "./utils";

export function SpatialExplorer({
  incidents,
  loading,
  error,
  filters,
  topCategories,
  dateRange,
  onSelectCategory,
}) {
  const categoryColorMap = useMemo(() => {
    const map = new Map();
    topCategories.forEach((item, idx) => {
      map.set(item.label, CATEGORY_COLOR_PALETTE[idx % CATEGORY_COLOR_PALETTE.length]);
    });
    return map;
  }, [topCategories]);

  const categoryList = topCategories.slice(0, 12);
  const activeCategory = filters.category || "All";

  return (
    <div
      style={{
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(15,23,42,0.1)",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        overflow: "visible",
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          City Incidents {incidents.length > 0 && (
            <span style={{ fontWeight: 500, color: "#6b7280", fontSize: "0.9rem" }}>
              ({incidents.length} showing)
            </span>
          )}
        </h2>
        {dateRange && (
          <div style={{ margin: 0, marginTop: "4px", fontSize: "0.75rem", color: "#9ca3af" }}>
            Available data range: {formatDisplayDate(dateRange.earliest)} → {formatDisplayDate(dateRange.latest)}
          </div>
        )}
        {(filters.fromDate || filters.toDate) ? (
          <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#3b82f6" }}>
            Filter range: 
            {filters.fromDate && ` From ${new Date(filters.fromDate).toLocaleString()}`}
            {filters.toDate && ` To ${new Date(filters.toDate).toLocaleString()}`}
          </div>
        ) : (
          dateRange && (
            <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#22c55e" }}>
              Displaying all available data from {formatDisplayDate(dateRange.earliest)} to {formatDisplayDate(dateRange.latest)}
            </div>
          )
        )}
      </div>

      {/* Map and Category List */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1fr)",
          gap: "12px",
          alignItems: "stretch",
          overflow: "visible",
        }}
      >
        {/* Map Container */}
        <div
          style={{
            position: "relative",
            borderRadius: "14px",
            overflow: "visible",
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
          }}
        >
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom
            style={{ height: "420px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <AutoFitBounds incidents={incidents} />
            
            {incidents.map((incident) => (
              <IncidentMarker
                key={`${incident.source_table}-${incident._idx}`}
                incident={incident}
                colorOverride={categoryColorMap.get(incident.incident_type)}
              />
            ))}
          </MapContainer>
          
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(248,250,252,0.6)",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              Loading incidents…
            </div>
          )}
          
          {!loading && incidents.length === 0 && !error && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.92)",
                fontWeight: 600,
                color: "#6b7280",
              }}
            >
              No incidents match the current filters. Try changing the filters.
            </div>
          )}
        </div>
        
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "16px",
            background: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Incidents by Category
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {categoryList.length > 0 ? (
              categoryList.map((item, idx) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background:
                      activeCategory === item.label
                        ? "rgba(17,24,39,0.08)"
                        : "rgba(255,255,255,0.9)",
                    border:
                      activeCategory === item.label
                        ? "1px solid rgba(17,24,39,0.2)"
                        : "1px solid rgba(209,213,219,0.6)",
                    cursor: "pointer",
                  }}
                  onClick={() => onSelectCategory(item.label)}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background:
                        categoryColorMap.get(item.label) ||
                        CATEGORY_COLOR_PALETTE[idx % CATEGORY_COLOR_PALETTE.length],
                    }}
                  />
                  <span style={{ color: "#1f2937", fontSize: "0.85rem", flex: 1 }}>
                    {item.label}
                  </span>
                  <span style={{ color: "#4b5563", fontSize: "0.8rem", fontWeight: 600 }}>
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                Not enough incidents for ranking.
              </span>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: "rgba(248,113,113,0.12)",
            color: "#b91c1c",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function AutoFitBounds({ incidents }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    if (!incidents || !incidents.length) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    
    // Filter out incidents with invalid coordinates
    const validIncidents = incidents.filter(
      (incident) => 
        incident && 
        Number.isFinite(incident.lat) && 
        Number.isFinite(incident.lon)
    );
    
    if (validIncidents.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    
    try {
      const incidentBounds = latLngBounds(
        validIncidents.map((incident) => [incident.lat, incident.lon])
      );
      
      const sfBounds = latLngBounds([
        [SF_BOUNDS.south, SF_BOUNDS.west],
        [SF_BOUNDS.north, SF_BOUNDS.east],
      ]);
      
      const boundsToFit = incidentBounds.pad(0.05);
      
      const finalBounds = latLngBounds([
        [
          Math.max(boundsToFit.getSouth(), sfBounds.getSouth()),
          Math.max(boundsToFit.getWest(), sfBounds.getWest()),
        ],
        [
          Math.min(boundsToFit.getNorth(), sfBounds.getNorth()),
          Math.min(boundsToFit.getEast(), sfBounds.getEast()),
        ],
      ]);

      map.fitBounds(finalBounds, { maxZoom: 14 });
    } catch (error) {
      console.error("Error fitting bounds:", error);
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
  }, [map, incidents]);

  return null;
}

function IncidentMarker({ incident, colorOverride }) {
  const color = colorOverride || SOURCE_COLORS[incident.source_table] || "#111827";

  return (
    <CircleMarker
      center={[incident.lat, incident.lon]}
      radius={6}
      pathOptions={{
        color,
        fillColor: color,
        weight: 1,
        fillOpacity: 0.75,
      }}
    >
      <Popup 
        autoPan={true}
        autoPanPaddingTopLeft={[50, 100]}
        autoPanPaddingBottomRight={[50, 50]}
      >
        <IncidentPopup incident={incident} badgeColor={color} />
      </Popup>
    </CircleMarker>
  );
}

function IncidentPopup({ incident, badgeColor }) {
  const incidentTime = parseDateSafely(incident.incident_time);
  const timeLabel = incidentTime ? formatDisplayDate(incidentTime) : "Unknown time";
  const coordinateLabel =
    Number.isFinite(incident.lat) && Number.isFinite(incident.lon)
      ? `${incident.lat.toFixed(5)}, ${incident.lon.toFixed(5)}`
      : "Unavailable";
  const trimmedDescription = incident.description?.trim();

  return (
    <div
      style={{
        minWidth: "240px",
        maxWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: badgeColor || "#111827",
          }}
        />
        <div style={{ fontWeight: 600, color: "#111827", flex: 1, fontSize: "0.9rem" }}>
          {incident.incident_type || "Unspecified incident"}
        </div>
      </div>

      {/* Time */}
      <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>{timeLabel}</div>

      {/* Address */}
      {incident.address && (
        <div style={{ fontSize: "0.8rem", color: "#111827" }}>
          <strong>Address:</strong> {incident.address}
          {incident.neighborhood ? ` (${incident.neighborhood})` : ""}
        </div>
      )}

      {/* Details */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          fontSize: "0.78rem",
          color: "#374151",
          background: "#f9fafb",
          padding: "6px 8px",
          borderRadius: "6px",
          border: "1px solid #e5e7eb",
        }}
      >
        <div>
          <strong>Source:</strong> {getSourceLabel(incident.source_table)}
        </div>
        {trimmedDescription && (
          <div>
            <strong>Description:</strong> {trimmedDescription}
          </div>
        )}
        <div>
          <strong>Coordinates:</strong> {coordinateLabel}
        </div>
      </div>
    </div>
  );
}

export function FilterField({ label, children }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        fontSize: "0.75rem",
        color: "#6b7280",
      }}
    >
      <span>{label}</span>
      {children}
    </div>
  );
}

export function SourceSelector({ selected, onToggle, onSelectAll }) {
  const allSelected = selected.length === SOURCE_OPTIONS.length;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      {SOURCE_OPTIONS.map((option) => {
        const isChecked = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "999px",
              border: isChecked ? "1px solid #10b981" : "1px solid #d1d5db",
              background: isChecked ? "rgba(16,185,129,0.12)" : "#f9fafb",
              color: "#1f2937",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: SOURCE_COLORS[option.value] || "#10b981",
              }}
            />
            {option.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onSelectAll}
        style={{
          padding: "8px 14px",
          borderRadius: "999px",
          border: "1px dashed #d1d5db",
          background: "transparent",
          fontSize: "0.78rem",
          color: "#4b5563",
          cursor: "pointer",
        }}
        disabled={allSelected}
      >
        Select All
      </button>
    </div>
  );
}

