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
    <div>
      <h2 style={{ marginTop: 0 }}>Query 2 — Top Neighborhoods by Incident Count</h2>

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

      {/* Results visualization */}
      {data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          No Data — click Load Data
        </div>
      ) : (() => {
        const maxCount = Math.max(...data.map(d => d.incident_count));
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.map((row, index) => {
              const barWidth = (row.incident_count / maxCount) * 100;
              const colors = [
                "#ef4444", "#f97316", "#f59e0b", "#10b981", "#14b8a6",
                "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"
              ];
              return (
                <div
                  key={index}
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div style={{ 
                      minWidth: "160px", 
                      fontSize: "0.95rem", 
                      fontWeight: 600,
                      color: "#111827"
                    }}>
                      {row.neighborhood}
                    </div>
                    <div style={{ flex: 1, position: "relative", height: "36px" }}>
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: "100%",
                          background: colors[index % colors.length],
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingRight: "12px",
                        }}
                      >
                        <span style={{ 
                          color: "white", 
                          fontSize: "0.9rem", 
                          fontWeight: 700,
                          textShadow: "0 1px 3px rgba(0,0,0,0.3)"
                        }}>
                          {row.incident_count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}

export default Query2;