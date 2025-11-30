//src/Query4.js
//This component implements Query 4:

import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "./config";

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
      const res = await fetch(`${API_BASE_URL}/stats/incident_type_breakdown`);
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
    <div>
      <h2 style={{ marginTop: 0 }}>Query 4 - Incident Type Breakdown</h2>
      <p>
        Fetch the crime vs. fire incident split using the aggregated statistics
        endpoint.
      </p>

      {/* Loading and error states */}
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {/* Result visualization */}
      {stats && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
            {/* Pie Chart */}
            <div style={{ position: "relative", width: "200px", height: "200px" }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {breakdownRows.length > 0 && (() => {
                  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
                  let currentAngle = 0;
                  
                  return breakdownRows.map((row, idx) => {
                    const percentage = row.percentage;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    
                    const startRad = (startAngle - 90) * (Math.PI / 180);
                    const endRad = (endAngle - 90) * (Math.PI / 180);
                    
                    const x1 = 100 + 80 * Math.cos(startRad);
                    const y1 = 100 + 80 * Math.sin(startRad);
                    const x2 = 100 + 80 * Math.cos(endRad);
                    const y2 = 100 + 80 * Math.sin(endRad);
                    
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    
                    currentAngle = endAngle;
                    
                    return (
                      <path
                        key={row.label}
                        d={path}
                        fill={colors[idx % colors.length]}
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  });
                })()}
              </svg>
            </div>
            
            {/* Legend and Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
                Total Incidents: {stats?.total_incidents?.toLocaleString() ?? 0}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {breakdownRows.map((row, idx) => {
                  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];
                  return (
                    <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          background: colors[idx % colors.length],
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{row.label}</div>
                        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                          {row.total.toLocaleString()} incidents ({row.percentage}%)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Query4;