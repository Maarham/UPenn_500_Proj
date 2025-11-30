// src/Query3.js
// This component implements Query 3 from the backend:
// GET /api/neighborhoods/danger-analysis
// It analyzes which neighborhoods are most dangerous at different
// times of day and on weekdays vs. weekends.
// Optional filters: neighborhood, time_period, day_type, and top_n.

import React, { useState } from "react";

function Query3() {
  // State variables for data, filters, UI states
  const [data, setData] = useState([]);              // API response rows
  const [neighborhood, setNeighborhood] = useState(""); // optional neighborhood filter
  const [timePeriod, setTimePeriod] = useState("");     // optional time period filter
  const [dayType, setDayType] = useState("");           // optional weekday/weekend filter
  const [topN, setTopN] = useState(10);                 // number of top results to show
  const [loading, setLoading] = useState(false);         // loading indicator
  const [error, setError] = useState("");                // error message

  // Function to fetch danger analysis results from backend
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // Build API URL dynamically based on filters
      let url = `/api/neighborhoods/danger-analysis?top_n=${topN}`;

      if (neighborhood !== "") url += `&neighborhood=${neighborhood}`;
      if (timePeriod !== "") url += `&time_period=${timePeriod}`;
      if (dayType !== "") url += `&day_type=${dayType}`;

      // Make request
      const res = await fetch(url);
      const json = await res.json();

      // Handle backend errors
      if (!res.ok) throw new Error(json.error || "Error loading data");

      // Save returned data
      setData(json.data || []);
    } catch (err) {
      // Show error message
      setError(err.message);
    } finally {
      // Stop loading indicator
      setLoading(false);
    }
  };

  // Valid filter options
  const timePeriods = ["", "Morning", "Afternoon", "Evening", "Night"];
  const dayTypes = ["", "Weekday", "Weekend"];

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Query 3 — Danger Analysis</h2>

      <p style={{ maxWidth: "900px" }}>
        Returns analysis of which neighborhoods are most dangerous at different times of day and day types.
      </p>

      {/* Filter controls */}
      <div style={{ marginBottom: "20px" }}>
        {/* Neighborhood input */}
        <label>
          Neighborhood:{" "}
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            style={{ marginRight: "20px" }}
            placeholder="Optional"
          />
        </label>

        {/* Time period dropdown */}
        <label>
          Time Period:{" "}
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            style={{ marginRight: "20px" }}
          >
            {timePeriods.map((t) => (
              <option key={t} value={t}>
                {t === "" ? "All" : t}
              </option>
            ))}
          </select>
        </label>

        {/* Day type dropdown */}
        <label>
          Day Type:{" "}
          <select
            value={dayType}
            onChange={(e) => setDayType(e.target.value)}
            style={{ marginRight: "20px" }}
          >
            {dayTypes.map((d) => (
              <option key={d} value={d}>
                {d === "" ? "All" : d}
              </option>
            ))}
          </select>
        </label>

        {/* Top N input */}
        <label>
          Top N:{" "}
          <input
            type="number"
            value={topN}
            onChange={(e) => setTopN(e.target.value)}
            style={{ width: "80px", marginRight: "20px" }}
          />
        </label>

        {/* Button to load results */}
        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Load Data"}
        </button>
      </div>

      {/* Error message */}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* Results table */}
      <table
        border="1"
        cellPadding="6"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Neighborhood</th>
            <th>Time Period</th>
            <th>Day Type</th>
            <th>Incident Count</th>
            <th>Incident Types</th>
            <th>% of Neighborhood</th>
          </tr>
        </thead>

        <tbody>
          {/* No data */}
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                No data.
              </td>
            </tr>
          ) : (
            // Render rows
            data.map((row, idx) => (
              <tr key={idx}>
                <td>{row.neighborhood}</td>
                <td>{row.time_period}</td>
                <td>{row.day_type}</td>
                <td>{row.incident_count}</td>
                <td>{row.incident_types}</td>
                <td>{row.pct_of_neighborhood_incidents}%</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Query3;