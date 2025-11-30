// src/Query9.js
// This component implements Query 9 from the backend:
// GET /api/fire/top-neighborhoods
// It returns, for each of the latest M years, the top N neighborhoods with
// the most fire incidents, plus each neighborhood's percentage share
// within that year.
//
// Query parameters:
//   - limit (1–100, default 10): max neighborhoods per year
//   - years (1–5, default 3): number of recent years to include

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "./config";

function Query9() {
  // User-controlled inputs for the backend query
  const [limit, setLimit] = useState(10); // neighborhoods per year
  const [years, setYears] = useState(3);  // how many recent years

  // State for API response
  const [rows, setRows] = useState([]);       // array of {year, rank, neighborhood, total_fires, percentage_of_total}
  const [summary, setSummary] = useState(null); // summary object from backend

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to fetch data from backend
  const loadData = useCallback(async () => {
    // Basic client-side validation to match backend constraints
    if (
      Number.isNaN(limit) ||
      limit < 1 ||
      limit > 100 ||
      Number.isNaN(years) ||
      years < 1 ||
      years > 5
    ) {
      setError("Limit must be 1–100 and years must be 1–5.");
      setRows([]);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Build query string with both parameters
      const url = `${API_BASE_URL}/api/fire/top-neighborhoods?limit=${limit}&years=${years}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load top fire neighborhoods");
      }

      // Backend returns { data: [...], summary: {...} }
      setRows(Array.isArray(json.data) ? json.data : []);
      setSummary(json.summary || null);
    } catch (err) {
      setError(err.message || "Unexpected error");
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [limit, years]);

  // Auto-load once on mount with default parameters
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to render summary line safely
  const renderSummary = () => {
    if (!summary) return null;

    const yearsAnalyzed = Array.isArray(summary.years_analyzed)
      ? summary.years_analyzed.join(", ")
      : "N/A";

    return (
      <div style={{ marginTop: "12px", fontSize: "0.9rem" }}>
        <div><strong>Years analyzed:</strong> {yearsAnalyzed}</div>
        <div><strong>Limit per year:</strong> {summary.limit_per_year}</div>
        <div><strong>Years requested:</strong> {summary.years_requested}</div>
        <div><strong>Total records:</strong> {summary.total_records}</div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Query 9 — Top Fire Neighborhoods by Year</h2>
      <p>
        For each of the latest M years, this view shows the top N neighborhoods
        with the highest number of fire incidents, plus each neighborhood’s
        percentage share within that year.
      </p>

      {/* Controls for limit and years */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <label>
          Limit per year (1–100):{" "}
          <input
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) =>
              setLimit(Number.parseInt(e.target.value, 10) || 10)
            }
            style={{ width: "80px" }}
          />
        </label>

        <label>
          Number of recent years (1–5):{" "}
          <input
            type="number"
            min="1"
            max="5"
            value={years}
            onChange={(e) =>
              setYears(Number.parseInt(e.target.value, 10) || 3)
            }
            style={{ width: "80px" }}
          />
        </label>

        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Load Data"}
        </button>
      </div>

      {/* Error message */}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {/* No data case */}
      {!loading && !error && rows.length === 0 && (
        <div>No data returned for the given parameters.</div>
      )}

      {/* Main visualization */}
      {rows.length > 0 && (() => {
        // Group by year
        const groupedByYear = rows.reduce((acc, row) => {
          if (!acc[row.year]) acc[row.year] = [];
          acc[row.year].push(row);
          return acc;
        }, {});
        
        const years = Object.keys(groupedByYear).sort();
        const maxFires = Math.max(...rows.map(r => r.total_fires));
        
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {years.map((year, yearIdx) => {
              const yearData = groupedByYear[year];
              const colors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#14b8a6", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"];
              
              return (
                <div key={year} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", background: "white" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
                    {year}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {yearData.map((row, idx) => {
                      const barWidth = (row.total_fires / maxFires) * 100;
                      
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ 
                            minWidth: "30px", 
                            fontSize: "0.75rem", 
                            fontWeight: 600,
                            color: "#6b7280",
                            textAlign: "center"
                          }}>
                            #{row.rank}
                          </div>
                          <div style={{ 
                            minWidth: "140px", 
                            fontSize: "0.85rem", 
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {row.neighborhood}
                          </div>
                          <div style={{ flex: 1, position: "relative", height: "28px" }}>
                            <div
                              style={{
                                width: `${barWidth}%`,
                                height: "100%",
                                background: colors[idx % colors.length],
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0 8px",
                              }}
                            >
                              <span style={{ 
                                color: "white", 
                                fontSize: "0.75rem", 
                                fontWeight: 600,
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                              }}>
                                {row.total_fires.toLocaleString()}
                              </span>
                              <span style={{ 
                                color: "white", 
                                fontSize: "0.7rem", 
                                fontWeight: 500,
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                              }}>
                                {row.percentage_of_total}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Summary section */}
      {renderSummary()}
    </div>
  );
}

export default Query9;