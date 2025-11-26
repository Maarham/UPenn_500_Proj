//frontend/src/Query9.js
// Visualizes top fire neighborhoods over recent years via
// GET /api/fire/top-neighborhoods with optional limit & years filters.

import React, { useState, useEffect, useCallback, useMemo } from "react";

const DEFAULT_LIMIT = 10;
const DEFAULT_YEARS = 3;

function Query9() {
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    // Validate inputs before hitting API
    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      setError("Limit must be between 1 and 100.");
      setRows([]);
      setSummary(null);
      return;
    }
    if (Number.isNaN(years) || years < 1 || years > 5) {
      setError("Years must be between 1 and 5.");
      setRows([]);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `/api/fire/top-neighborhoods?limit=${limit}&years=${years}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "Failed to load top fire neighborhoods per year"
        );
      }

      setRows(Array.isArray(json.data) ? json.data : []);
      setSummary(json.summary ?? null);
    } catch (err) {
      setError(err.message);
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [limit, years]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupedByYear = useMemo(() => {
    const grouped = new Map();
    rows.forEach((row) => {
      const yearBucket = grouped.get(row.year) ?? [];
      yearBucket.push(row);
      grouped.set(row.year, yearBucket);
    });
    return grouped;
  }, [rows]);

  return (
    <div style={{ padding: "20px", maxWidth: "960px" }}>
      <h2>Query 9 — Top Fire Neighborhoods by Year</h2>
      <p>
        Review which neighborhoods have the highest fire incident counts across
        the most recent years. Adjust the limit and number of years to explore
        different portions of the dataset.
      </p>

      <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
        <label>
          Limit per Year (1-100):{" "}
          <input
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10) || 0)}
            style={{ width: "100px" }}
          />
        </label>
        <label>
          Years (1-5):{" "}
          <input
            type="number"
            min="1"
            max="5"
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value, 10) || 0)}
            style={{ width: "80px" }}
          />
        </label>
        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading…" : "Load Data"}
        </button>
      </div>

      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {!loading && rows.length === 0 && !error && (
        <div>No fire incident data available.</div>
      )}

      {summary && (
        <div style={{ marginBottom: "16px" }}>
          <strong>Summary:</strong>{" "}
          {summary.message ? (
            summary.message
          ) : (
            <span>
              Years analyzed:{" "}
              {Array.isArray(summary.years_analyzed)
                ? summary.years_analyzed.join(", ")
                : "n/a"}
              {" | "}
              Limit per year: {summary.limit_per_year}
              {" | "}
              Years requested: {summary.years_requested}
              {" | "}
              Total records: {summary.total_records}
            </span>
          )}
        </div>
      )}

      {groupedByYear.size > 0 && (
        <div>
          {[...groupedByYear.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([yearValue, yearRows]) => (
              <div key={yearValue} style={{ marginBottom: "24px" }}>
                <h3 style={{ marginBottom: "8px" }}>{yearValue}</h3>
                <table
                  border="1"
                  cellPadding="6"
                  style={{ borderCollapse: "collapse", width: "100%" }}
                >
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Neighborhood</th>
                      <th>Total Fires</th>
                      <th>% of Total Fires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearRows.map((row) => (
                      <tr key={`${yearValue}-${row.rank}`}>
                        <td>{row.rank}</td>
                        <td>{row.neighborhood}</td>
                        <td>{row.total_fires}</td>
                        <td>{row.percentage_of_total}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default Query9;