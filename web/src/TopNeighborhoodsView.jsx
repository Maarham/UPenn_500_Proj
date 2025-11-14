import React, { useState } from "react";
import { dummyTopNeighborhoods } from "./dummyData";

const thStyle = {
  borderBottom: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
  position: "sticky",
  top: 0,
  backgroundColor: "#f8f8f8",
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: "6px 8px",
  verticalAlign: "top",
};

function TopNeighborhoodsView() {
  const [minCount, setMinCount] = useState(0);

  const filteredData =
    minCount > 0
      ? dummyTopNeighborhoods.filter(
          (row) => row.incident_count >= minCount
        )
      : dummyTopNeighborhoods;

  return (
    <div>
      <h2>Top Neighborhoods (Dummy)</h2>

      {/* Filter section */}
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <label>
          <strong>Min Incident Count:</strong>
          <input
            type="number"
            value={minCount}
            onChange={(e) => setMinCount(Number(e.target.value))}
            placeholder="e.g. 5000"
            style={{ width: "120px", marginLeft: "8px" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <strong>Showing neighborhoods:</strong> {filteredData.length}
      </div>

      {filteredData.length > 0 ? (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Rank</th>
                <th style={thStyle}>Neighborhood</th>
                <th style={thStyle}>Incident Count</th>
                <th style={thStyle}>Data Sources</th>
                <th style={thStyle}>Incident Types</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>{row.neighborhood}</td>
                  <td style={tdStyle}>{row.incident_count}</td>
                  <td style={tdStyle}>{row.data_sources}</td>
                  <td style={tdStyle}>{row.incident_types}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>No data.</div>
      )}
    </div>
  );
}

export default TopNeighborhoodsView;