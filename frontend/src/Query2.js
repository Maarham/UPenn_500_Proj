// src/Query2.js
// This component implements Query 2 from the backend:
// GET /api/neighborhood/top
// It retrieves the top neighborhoods ranked by total incident count,
// with optional filters for limit and minimum incident threshold.

import React, { useState } from "react";

function Query2() {
  // State variables for API data, filters, UI states
  const [data, setData] = useState([]);          // stores the API response rows
  const [limit, setLimit] = useState(10);        // number of neighborhoods to return
  const [minIncidents, setMinIncidents] = useState(""); // optional minimum incident count filter
  const [loading, setLoading] = useState(false); // loading indicator
  const [error, setError] = useState("");        // error message

  // Function to load data from backend
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Build the API URL dynamically
      let url = `/api/neighborhood/top?limit=${limit}`;
      if (minIncidents !== "") {
        url += `&min_incidents=${minIncidents}`;
      }

      // Make request to backend
      const res = await fetch(url);
      const json = await res.json();

      // Handle backend error responses
      if (!res.ok) {
        throw new Error(json.error || "Unknown error");
      }

      // Store valid data into state
      setData(json.data || []);
    } catch (err) {
      // Capture and show error message
      setError(err.message);
    } finally {
      // Reset loading indicator
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px" }}>
      <h2>Query 2 — Top Neighborhoods by Incident Count</h2>

      <p style={{ maxWidth: "900px" }}>
        Returns a ranked list of neighborhoods by total incident count, including
        distinct types and sources.
      </p>

      {/* Filter controls */}
      <div style={{ marginBottom: "15px" }}>
        {/* Limit input */}
        <label>
          Limit:{" "}
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            style={{ width: "80px", marginRight: "20px" }}
          />
        </label>

        {/* Minimum incidents input */}
        <label>
          Min Incidents:{" "}
          <input
            type="number"
            value={minIncidents}
            onChange={(e) => setMinIncidents(e.target.value)}
            style={{ width: "120px", marginRight: "20px" }}
            placeholder="optional"
          />
        </label>

        {/* Button to load data */}
        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Load Data"}
        </button>
      </div>

      {/* Error message */}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {/* Results table */}
      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Neighborhood</th>
            <th>Incident Count</th>
            <th>Data Sources</th>
            <th>Incident Types</th>
          </tr>
        </thead>

        <tbody>
          {/* If no data yet */}
          {data.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No Data — click Load Data
              </td>
            </tr>
          ) : (
            // Loop through returned rows
            data.map((row, index) => (
              <tr key={index}>
                <td>{row.neighborhood}</td>
                <td>{row.incident_count}</td>
                <td>{row.data_sources}</td>
                <td>{row.incident_types}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Query2;