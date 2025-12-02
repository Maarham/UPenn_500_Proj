import React, { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

// Query components
import Query2 from "./Query2";
import Query3 from "./Query3";
import Query4 from "./Query4";
import Query5 from "./Query5";
import Query6 from "./Query6";
import Query7 from "./Query7";
import Query8 from "./Query8";
import Query9 from "./Query9";
import Query10 from "./Query10";
import IncidentReport from "./IncidentReport";

// Utilities and constants
import {
  SOURCE_OPTIONS,
  isWithinSFBounds,
  parseDateSafely,
  createInitialFilters,
  inputStyle,
  getApiUrl,
} from "./utils";

// Map and filter components
import { SpatialExplorer, FilterField, SourceSelector } from "./MapView";

// Reusable Card Component
const Card = ({ children, variant = "default" }) => {
  const baseStyle = {
    background: "white",
    borderRadius: "10px",
    padding: "12px",
    boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
  };

  const variants = {
    default: baseStyle,
    large: {
      ...baseStyle,
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 12px 32px rgba(15,23,42,0.08)",
    },
  };

  return <div style={variants[variant]}>{children}</div>;
};

function App() {

  const [activeTab, setActiveTab] = useState(1);

  // Initialize filter state
  const initialFiltersState = useMemo(() => {
    const defaults = createInitialFilters();
    return { ...defaults, sources: [...defaults.sources] };
  }, []);

  const [filters, setFilters] = useState(initialFiltersState);
  const [fetchParams, setFetchParams] = useState(() => ({
    limit: initialFiltersState.limit,
    sources: [...initialFiltersState.sources],
    requestId: 0,
  }));
  const [rawIncidents, setRawIncidents] = useState([]);
  const [spatialLoading, setSpatialLoading] = useState(false);
  const [spatialError, setSpatialError] = useState("");

  // 
  // Data Loading
  // 
  useEffect(() => {
    // Only load incidents on Tab 1 (Timeline)
    if (activeTab !== 1) return;

    const controller = new AbortController();

    const loadIncidents = async () => {
      setSpatialLoading(true);
      setSpatialError("");

      try {
        // Set up API parameters
        const params = new URLSearchParams();
        params.set("limit", fetchParams.limit);
        // Prioritize coordinates for map rendering (Tab 1 only)
        params.set("prioritize_coords", "true");

        if (fetchParams.sources.length === 1) {
          params.set("source", fetchParams.sources[0]);
        }

        // Call API
        const response = await fetch(getApiUrl(`/api/incidents/timeline?${params.toString()}`), {
          signal: controller.signal,
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Failed to load incidents");
        }

        setRawIncidents(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSpatialError(error.message);
          setRawIncidents([]);
        }
      } finally {
        setSpatialLoading(false);
      }
    };

    loadIncidents();

    return () => controller.abort();
  }, [fetchParams, activeTab]);

  
  // Data Processing
  
  // Generate category options
  const categoryOptions = useMemo(() => {
    if (activeTab !== 1) return ["All"];
    
    const categories = new Set();
    rawIncidents.forEach((incident) => {
      const lat = Number(incident?.latitude);
      const lon = Number(incident?.longitude);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        isWithinSFBounds(lat, lon) &&
        incident?.incident_type
      ) {
        categories.add(incident.incident_type);
      }
    });

    return ["All", ...Array.from(categories).sort()];
  }, [rawIncidents, activeTab]);

  // Validate category when it changes
  useEffect(() => {
    if (activeTab !== 1) return;
    if (filters.category !== "All" && !categoryOptions.includes(filters.category)) {
      setFilters((prev) => ({ ...prev, category: "All" }));
    }
  }, [categoryOptions, filters.category, activeTab]);

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    if (activeTab !== 1) return [];

    const from = parseDateSafely(filters.fromDate);
    const to = parseDateSafely(filters.toDate);

    return rawIncidents
      .filter((incident) => {
        // Validate coordinates - must exist and be valid numbers
        if (incident?.latitude == null || incident?.longitude == null) return false;
        
        const lat = Number(incident.latitude);
        const lon = Number(incident.longitude);
        
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
        if (!isWithinSFBounds(lat, lon)) return false;

        // Source filter
        if (filters.sources.length && !filters.sources.includes(incident.source_table)) {
          return false;
        }

        // Category filter
        if (filters.category !== "All" && incident.incident_type !== filters.category) {
          return false;
        }

        // Date filter - only apply if dates are explicitly set
        // If no dates are set, show all available data (from earliest to latest)
        if (from || to) {
          const incidentTime = parseDateSafely(incident.incident_time);
          if (!incidentTime) return false;
          if (from && incidentTime < from) return false;
          if (to && incidentTime > to) return false;
        }
        // If no date filters are set, include all incidents (no date filtering)

        return true;
      })
      .map((incident, idx) => ({
        ...incident,
        lat: Number(incident.latitude),
        lon: Number(incident.longitude),
        _idx: idx,
      }));
  }, [rawIncidents, filters, activeTab]);

  // Calculate top categories
  const topCategories = useMemo(() => {
    if (activeTab !== 1) return [];

    const counts = new Map();
    filteredIncidents.forEach((incident) => {
      const key = incident.incident_type || "Unspecified";
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [filteredIncidents, activeTab]);

  const totalIncidentsLoaded = rawIncidents.length;

  // Calculate date range of data
  const dateRange = useMemo(() => {
    if (rawIncidents.length === 0) return null;
    
    const dates = rawIncidents
      .map((i) => parseDateSafely(i.incident_time))
      .filter((d) => d !== null)
      .sort((a, b) => a - b);
    
    if (dates.length === 0) return null;
    
    return {
      earliest: dates[0],
      latest: dates[dates.length - 1],
    };
  }, [rawIncidents]);

  // Event Handlers
  
  // Toggle source selection
  const handleSourceToggle = (source) => {
    setFilters((prev) => {
      const isSelected = prev.sources.includes(source);
      if (isSelected) {
        // At least one source must remain selected
        if (prev.sources.length === 1) return prev;
        return { ...prev, sources: prev.sources.filter((s) => s !== source) };
      }
      return { ...prev, sources: [...prev.sources, source] };
    });
  };

  // Select all sources
  const handleSelectAllSources = () => {
    setFilters((prev) => ({
      ...prev,
      sources: SOURCE_OPTIONS.map((option) => option.value),
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    if (filters.sources.length === 0) {
      setSpatialError("Select at least one data source to visualize incidents.");
      return;
    }

    setSpatialError("");
    setFetchParams((prev) => ({
      limit: filters.limit,
      sources: [...filters.sources],
      requestId: prev.requestId + 1,
    }));
  };

  // Reset filters
  const handleResetFilters = () => {
    const defaults = createInitialFilters();
    setFilters({ ...defaults, sources: [...defaults.sources] });
    setSpatialError("");
    setFetchParams((prev) => ({
      limit: defaults.limit,
      sources: [...defaults.sources],
      requestId: prev.requestId + 1,
    }));
  };

  // Tab Content Rendering
  const renderTabContent = () => {
    // Tab 1: Timeline - Map visualization
    if (activeTab === 1) {
      return (
        <>
          <section
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "10px 14px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
              marginBottom: "12px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <FilterField label="Max Records">
              <select
                value={filters.limit}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, limit: Number(e.target.value) }))
                }
                style={inputStyle}
              >
                <option value="1000">1,000</option>
                <option value="5000">5,000</option>
                <option value="10000">10,000</option>

              </select>
            </FilterField>
            <FilterField label="From">
              <input
                type="datetime-local"
                lang="en"
                value={filters.fromDate || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
                style={inputStyle}
              />
            </FilterField>
            <FilterField label="To">
              <input
                type="datetime-local"
                lang="en"
                value={filters.toDate || ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                style={inputStyle}
              />
            </FilterField>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginLeft: "auto",
              }}
            >
              <button
                style={{
                  padding: "12px 22px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={handleApplyFilters}
                disabled={spatialLoading}
              >
                {spatialLoading ? "Loading..." : "Search in this area"}
              </button>
              <button
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#111827",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                onClick={handleResetFilters}
                disabled={spatialLoading}
              >
                Reset
              </button>
            </div>
            <div style={{ flexBasis: "100%", height: "1px", background: "#e5e7eb" }} />
            <SourceSelector
              selected={filters.sources}
              onToggle={handleSourceToggle}
              onSelectAll={handleSelectAllSources}
            />
          </section>

          <SpatialExplorer
            incidents={filteredIncidents}
            totalLoaded={totalIncidentsLoaded}
            loading={spatialLoading}
            error={spatialError}
            filters={filters}
            topCategories={topCategories}
            dateRange={dateRange}
            onSelectCategory={(category) =>
              setFilters((prev) => ({ ...prev, category }))
            }
          />
        </>
      );
    }
    // Tab 2: Neighborhoods - Regional analysis
    else if (activeTab === 2) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Card>
            <Query2 />
          </Card>
          <Card>
            <Query3 />
          </Card>
        </div>
      );
    }
    // Tab 3: Stats & Trends
    else if (activeTab === 3) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
          <Card>
            <Query4 />
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Card variant="large">
              <Query5 />
            </Card>
            <Card variant="large">
              <Query6 />
            </Card>
          </div>
        </div>
      );
    }
    // Tab 4: Fire & Response
    else if (activeTab === 4) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <Card>
            <Query7 />
          </Card>
          <Card>
            <Query8 />
          </Card>
          <Card>
            <Query9 />
          </Card>
          <Card>
            <Query10 />
          </Card>
        </div>
      );
    }
    // Tab 5: Incident Report
    else if (activeTab === 5) {
      return (
        <Card variant="large">
          <IncidentReport />
        </Card>
      );
    }
  };

  // UI Rendering
  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 24px 20px" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "12px" }}>
          <h1
            style={{
              fontSize: "1.6rem",
              margin: 0,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            San Francisco Public Safety Dashboard
          </h1>
        </header>

        {/* Tab Navigation */}
        <nav
          style={{
            background: "white",
            borderRadius: "10px",
            padding: "8px 12px",
            boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
            marginBottom: "12px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { id: 1, label: "Timeline" },
            { id: 2, label: "Neighborhoods" },
            { id: 3, label: "Stats & Trends" },
            { id: 4, label: "Fire & Response" },
            { id: 5, label: "Report Incident" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: activeTab === tab.id ? "2px solid #22c55e" : "1px solid #d1d5db",
                background: activeTab === tab.id ? "rgba(34,197,94,0.15)" : "white",
                color: activeTab === tab.id ? "#15803d" : "#6b7280",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;
