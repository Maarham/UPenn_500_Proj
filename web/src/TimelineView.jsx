import React, { useState } from "react";
import { dummyTimeline } from "./dummyData";

const thStyle = {
  borderBottom: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
  top: 0,
  backgroundColor: "#f8f8f8",
  position: "sticky",
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: "6px 8px",
};


function TimelineView() {
  const [limit, setLimit] = useState(50);
  const [neighborhood, setNeighborhood] = useState("");

  const neighborhoodOptions = [
    "",
    ...Array.from(
      new Set(
        dummyTimeline
          .map((row) => row.neighborhood)
          .filter((value) => value && value.trim() !== "")
      )
    ).sort(),
  ];

  // neighborhood 필터
  let filtered = dummyTimeline;
  if (neighborhood) {
    filtered = filtered.filter((row) => row.neighborhood === neighborhood);
  }

  // limit
  const limited = filtered.slice(0, limit);

  return (
    <div>
      <h2>Incidents Timeline (Dummy)</h2>

      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <label style={{ marginRight: "16px" }}>
          <strong>Limit:</strong>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ width: "80px", marginLeft: "8px" }}
          />
        </label>

        <label>
          <strong>Neighborhood:</strong>
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            style={{ marginLeft: "8px" }}
          >
            {neighborhoodOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "All Neighborhoods"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Table */}
      {limited.length > 0 ? (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "14px",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Neighborhood</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Address</th>
              </tr>
            </thead>
            <tbody>
              {limited.map((row, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{row.incident_time}</td>
                  <td style={tdStyle}>{row.source}</td>
                  <td style={tdStyle}>{row.neighborhood}</td>
                  <td style={tdStyle}>{row.incident_type}</td>
                  <td style={tdStyle}>{row.description}</td>
                  <td style={tdStyle}>{row.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>No data found</div>
      )}
    </div>
  );
}

export default TimelineView;