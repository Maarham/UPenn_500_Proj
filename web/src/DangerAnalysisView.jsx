import React, { useState } from "react";
import { dummyDangerAnalysis } from "./dummyData";

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

function DangerAnalysisView() {
  // Filter state
  const [neighborhood, setNeighborhood] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [dayType, setDayType] = useState("");

  // Unique dropdown options
  const neighborhoods = [
    ...new Set(dummyDangerAnalysis.map((d) => d.neighborhood)),
  ];
  const timePeriods = ["Morning", "Afternoon", "Evening", "Night"];
  const dayTypes = ["Weekday", "Weekend"];

  // Apply filters
  let filtered = dummyDangerAnalysis;

  if (neighborhood) {
    filtered = filtered.filter((row) => row.neighborhood === neighborhood);
  }

  if (timePeriod) {
    filtered = filtered.filter((row) => row.time_period === timePeriod);
  }

  if (dayType) {
    filtered = filtered.filter((row) => row.day_type === dayType);
  }

  return (
    <div>
      <h2>Danger Analysis (Dummy)</h2>
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        {/* Neighborhood filter */}
        <label style={{ marginRight: "16px" }}>
          <strong>Neighborhood:</strong>
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          >
            <option value="">All Neighborhoods</option>
            {neighborhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginRight: "16px" }}>
          <strong>Time Period:</strong>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
          >
            <option value="">All Time Periods</option>
            {timePeriods.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginRight: "16px" }}>
          <strong>Day Type:</strong>
          <select value={dayType} onChange={(e) => setDayType(e.target.value)}>
            <option value="">All Day Types</option>
            {dayTypes.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length > 0 ? (
        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Neighborhood</th>
                <th style={thStyle}>Time Period</th>
                <th style={thStyle}>Day Type</th>
                <th style={thStyle}>Incident Count</th>
                <th style={thStyle}>Incident Types</th>
                <th style={thStyle}>Percentage of Neighborhood Incidents</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{row.neighborhood}</td>
                  <td style={tdStyle}>{row.time_period}</td>
                  <td style={tdStyle}>{row.day_type}</td>
                  <td style={tdStyle}>{row.incident_count}</td>
                  <td style={tdStyle}>{row.incident_types}</td>
                  <td style={tdStyle}>
                    {row.pct_of_neighborhood_incidents}
                  </td>
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

export default DangerAnalysisView;

