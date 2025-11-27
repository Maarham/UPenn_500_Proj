// src/Query9.js
// This component implements Query 9 from the backend:
// GET /api/fire/top-neighborhoods
// It returns, for each of the latest M years, the top N neighborhoods with
// the most fire incidents, plus each neighborhood’s percentage share
// within that year.
//
// Query parameters:
//   - limit (1–100, default 10): max neighborhoods per year
//   - years (1–5, default 3): number of recent years to include

import React, { useState, useEffect, useCallback } from "react";

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
      const url = `/api/fire/top-neighborhoods?limit=${limit}&years=${years}`;

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
    <div style={{ padding: "20px", maxWidth: "900px" }}>
      <h2>Query 9 — Top Fire Neighborhoods by Year</h2>
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

      {/* Main table */}
      {rows.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th>Year</th>
              <th>Rank</th>
              <th>Neighborhood</th>
              <th>Total Fires</th>
              <th>% of All Fires</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.year}</td>
                <td>{row.rank}</td>
                <td>{row.neighborhood}</td>
                <td>{row.total_fires}</td>
                <td>{row.percentage_of_total}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Summary section */}
      {renderSummary()}
    </div>
  );
}

export default Query9;