//src/Query4.js
//This component implements Query 4:

import React, { useState, useEffect, useCallback } from "react";

function Query4() {
  // State for API response, loading indicator, and potential error
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to fetch the incident type breakdown from the backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/stats/incident_type_breakdown");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load incident statistics");
      }

      setStats(json);
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to format entries for display (crime, fire, etc.)
  const breakdownRows =
    stats === null
      ? []
      : Object.entries(stats)
          .filter(([key]) => key !== "total_incidents")
          .map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            total: value?.total ?? 0,
            percentage: value?.percentage ?? 0,
          }));

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Query 4 - Incident Type Breakdown</h2>
      <p>
        Fetch the crime vs. fire incident split using the aggregated statistics
        endpoint.
      </p>

      {/* Loading and error states */}
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {/* Result table */}
      {stats && (
        <div>
          <table
            border="1"
            cellPadding="8"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>Incident Type</th>
                <th>Total Incidents</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {breakdownRows.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No data available
                  </td>
                </tr>
              ) : (
                breakdownRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.total}</td>
                    <td>{row.percentage}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ marginTop: "10px", fontWeight: "bold" }}>
            Total Incidents: {stats?.total_incidents ?? 0}
          </div>
        </div>
      )}
    </div>
  );
}

export default Query4;