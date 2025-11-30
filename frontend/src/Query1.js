// src/Query1.js
// This component connects to the backend API for Query 1:
// GET /api/incidents/timeline
// It loads all incidents ordered by time, with optional filtering by source table.

import React, { useState } from "react";

function Query1() {
  // State variables for data, filters, loading status, error messages
  const [data, setData] = useState([]);        // stores API result rows
  const [limit, setLimit] = useState(20);      // number of records to return
  const [source, setSource] = useState("");    // optional source filter
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to fetch data from backend API
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Build request URL dynamically based on selected parameters
      let url = `/api/incidents/timeline?limit=${limit}`;
      if (source !== "") {
        url += `&source=${source}`;
      }

      // Make API request
      const res = await fetch(url);
      const json = await res.json();

      // Handle backend error cases
      if (!res.ok) throw new Error(json.error || "Error loading data");

      // Save data into state
      setData(json.data || []);
    } catch (err) {
      // Capture and show error message
      setError(err.message);
    } finally {
      // Reset loading indicator
      setLoading(false);
    }
  };

  // All valid data sources (from backend README)
  const sources = [
    "",
    "311_service_requests",
    "fire_incidents",
    "fire_safety_complaints",
    "fire_violations",
    "sffd_service_calls",
    "sfpd_incidents",
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Query 1 — All Incidents by Time</h2>

      <p style={{ maxWidth: "900px" }}>
        Returns all incidents from multiple data sources (311, fire, safety
        complaints, violations, service calls, and police) combined and ordered
        by time.
      </p>

      {/* Filter controls */}
      <div style={{ marginBottom: "20px" }}>
        {/* Limit input */}
        <label>
          Limit:{" "}
          <input
            type="number"
            value={limit}
            style={{ width: "80px", marginRight: "20px" }}
            onChange={(e) => setLimit(e.target.value)}
          />
        </label>

        {/* Source dropdown */}
        <label>
          Source:{" "}
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ marginRight: "20px" }}
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "ALL" : s}
              </option>
            ))}
          </select>
        </label>

        {/* Button to load data */}
        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Load Data"}
        </button>
      </div>

      {/* Error message */}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {/* Data table */}
      <table
        border="1"
        cellPadding="6"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Time</th>
            <th>Source</th>
            <th>Incident Type</th>
            <th>Description</th>
            <th>Address</th>
            <th>Neighborhood</th>
          </tr>
        </thead>

        <tbody>
          {/* If no data after loading */}
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No data.
              </td>
            </tr>
          ) : (
            // Loop through returned rows
            data.map((row, idx) => (
              <tr key={idx}>
                <td>{row.incident_time}</td>
                <td>{row.source_table}</td>
                <td>{row.incident_type}</td>
                <td>{row.description}</td>
                <td>{row.address}</td>
                <td>{row.neighborhood}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Query1;