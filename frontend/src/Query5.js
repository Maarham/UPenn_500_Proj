// src/Query5.js
// This component implements Query 5 from the backend:
// GET /stats/monthly_incidents
// It retrieves monthly crime and fire incident counts (plus totals) per YYYY-MM.

import React, { useState, useEffect, useCallback, useMemo } from "react";

function Query5() {
  // State for API response, loading indicator, and potential error
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortDescending, setSortDescending] = useState(false);

  // Function to fetch the monthly aggregation from the backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/stats/monthly_incidents");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load monthly incident stats");
      }

      const rows = Object.entries(json || {}).map(([month, counts]) => ({
        month,
        crimeCnt: counts?.crime_cnt ?? 0,
        fireCnt: counts?.fire_cnt ?? 0,
        totalCnt: counts?.total_incidents ?? 0,
      }));

      setMonths(rows);
    } catch (err) {
      setError(err?.message || "Failed to load monthly incident stats");
      setMonths([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedMonths = useMemo(() => {
    const copy = [...months];
    copy.sort((a, b) =>
      sortDescending
        ? b.month.localeCompare(a.month)
        : a.month.localeCompare(b.month)
    );
    return copy;
  }, [months, sortDescending]);

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Query 5 - Monthly Incidents</h2>
      <p>
        View the monthly counts of crime, fire incidents, and total incidents,
        as returned by the backend aggregation query.
      </p>

      <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Reload Data"}
        </button>
        <button
          onClick={() => setSortDescending((prev) => !prev)}
          disabled={loading || months.length === 0}
        >
          Sort {sortDescending ? "Oldest -> Newest" : "Newest -> Oldest"}
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {!loading && !error && sortedMonths.length === 0 && (
        <div>No monthly data returned</div>
      )}

      {!loading && !error && sortedMonths.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th>Month</th>
              <th>Crime Count</th>
              <th>Fire Count</th>
              <th>Total Count</th>
            </tr>
          </thead>
          <tbody>
            {sortedMonths.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.crimeCnt}</td>
                <td>{row.fireCnt}</td>
                <td>{row.totalCnt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Query5;
    