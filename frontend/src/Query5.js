// src/Query5.js
// This component implements Query 5 from the backend:
// GET /stats/monthly_incidents
// It retrieves monthly crime and fire incident counts (plus totals) per YYYY-MM.

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL } from "./config";

function Query5() {
  // State for API response, loading indicator, and potential error
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortDescending, setSortDescending] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Function to fetch the monthly aggregation from the backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/stats/monthly_incidents`);
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
    <div>
      <h2 style={{ marginTop: 0 }}>Query 5 - Monthly Incidents</h2>
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

      {!loading && !error && sortedMonths.length > 0 && (() => {
        const maxValue = Math.max(...sortedMonths.map(m => Math.max(m.crimeCnt, m.fireCnt, m.totalCnt)));
        const chartHeight = 400;
        const chartWidth = 900;
        const paddingTop = 40;
        const paddingBottom = 60;
        const paddingLeft = 70;
        const paddingRight = 40;
        
        const plotHeight = chartHeight - paddingTop - paddingBottom;
        const plotWidth = chartWidth - paddingLeft - paddingRight;
        
        const getY = (value) => paddingTop + plotHeight - (value / maxValue) * plotHeight;
        const getX = (index, total) => paddingLeft + (index / (total - 1)) * plotWidth;
        
        // Format numbers with commas
        const formatNumber = (num) => num.toLocaleString();
        
        // Y-axis labels
        const yAxisSteps = 5;
        const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
          const value = Math.round((maxValue / yAxisSteps) * i);
          return { value, y: getY(value) };
        });
        
        // X-axis labels (show every few months to avoid crowding)
        const xAxisInterval = Math.max(1, Math.floor(sortedMonths.length / 10));
        const xAxisLabels = sortedMonths
          .map((m, i) => ({ month: m.month, x: getX(i, sortedMonths.length), index: i }))
          .filter((_, i) => i % xAxisInterval === 0 || i === sortedMonths.length - 1);
        
        const crimePoints = sortedMonths.map((m, i) => 
          `${getX(i, sortedMonths.length)},${getY(m.crimeCnt)}`
        ).join(' ');
        
        const firePoints = sortedMonths.map((m, i) => 
          `${getX(i, sortedMonths.length)},${getY(m.fireCnt)}`
        ).join(' ');
        
        const totalPoints = sortedMonths.map((m, i) => 
          `${getX(i, sortedMonths.length)},${getY(m.totalCnt)}`
        ).join(' ');
        
        return (
          <div style={{ position: "relative" }}>
            <svg
              width="100%"
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ border: "1px solid #e5e7eb", borderRadius: "8px", background: "white" }}
            >
              {/* Grid lines */}
              {yAxisLabels.map(({ value, y }) => (
                <g key={value}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#6b7280"
                    fontSize="12"
                    fontFamily="Inter, sans-serif"
                  >
                    {formatNumber(value)}
                  </text>
                </g>
              ))}
              
              {/* X-axis labels */}
              {xAxisLabels.map(({ month, x }) => (
                <text
                  key={month}
                  x={x}
                  y={chartHeight - paddingBottom + 20}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                  transform={`rotate(-45, ${x}, ${chartHeight - paddingBottom + 20})`}
                >
                  {month}
                </text>
              ))}
              
              {/* Axes */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={chartHeight - paddingBottom}
                stroke="#374151"
                strokeWidth="2"
              />
              <line
                x1={paddingLeft}
                y1={chartHeight - paddingBottom}
                x2={chartWidth - paddingRight}
                y2={chartHeight - paddingBottom}
                stroke="#374151"
                strokeWidth="2"
              />
              
              {/* Total line */}
              <polyline
                points={totalPoints}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Crime line */}
              <polyline
                points={crimePoints}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Fire line */}
              <polyline
                points={firePoints}
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {sortedMonths.map((m, i) => {
                const x = getX(i, sortedMonths.length);
                return (
                  <g key={i}>
                    {/* Crime point */}
                    <circle
                      cx={x}
                      cy={getY(m.crimeCnt)}
                      r="4"
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="1.5"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredPoint({ type: 'crime', index: i, ...m })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* Fire point */}
                    <circle
                      cx={x}
                      cy={getY(m.fireCnt)}
                      r="4"
                      fill="#f97316"
                      stroke="white"
                      strokeWidth="1.5"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredPoint({ type: 'fire', index: i, ...m })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* Total point */}
                    <circle
                      cx={x}
                      cy={getY(m.totalCnt)}
                      r="4"
                      fill="#6366f1"
                      stroke="white"
                      strokeWidth="1.5"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoveredPoint({ type: 'total', index: i, ...m })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
              
              {/* Axis labels */}
              <text
                x={paddingLeft - 50}
                y={paddingTop + plotHeight / 2}
                textAnchor="middle"
                fill="#111827"
                fontSize="14"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
                transform={`rotate(-90, ${paddingLeft - 50}, ${paddingTop + plotHeight / 2})`}
              >
                Incident Count
              </text>
              
              <text
                x={paddingLeft + plotWidth / 2}
                y={chartHeight - 10}
                textAnchor="middle"
                fill="#111827"
                fontSize="14"
                fontWeight="600"
                fontFamily="Inter, sans-serif"
              >
                Month
              </text>
            </svg>
            
            {/* Tooltip */}
            {hoveredPoint && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(17, 24, 39, 0.95)",
                  color: "white",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  pointerEvents: "none",
                  zIndex: 1000,
                }}
              >
                <div style={{ fontWeight: "700", marginBottom: "6px", color: "#fff" }}>
                  {hoveredPoint.month}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>
                    <span style={{ color: "#ef4444", fontWeight: "600" }}>Crime:</span>{" "}
                    {formatNumber(hoveredPoint.crimeCnt)}
                  </div>
                  <div>
                    <span style={{ color: "#f97316", fontWeight: "600" }}>Fire:</span>{" "}
                    {formatNumber(hoveredPoint.fireCnt)}
                  </div>
                  <div>
                    <span style={{ color: "#6366f1", fontWeight: "600" }}>Total:</span>{" "}
                    {formatNumber(hoveredPoint.totalCnt)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Legend */}
            <div style={{ display: "flex", gap: "24px", marginTop: "16px", justifyContent: "center", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "4px", background: "#ef4444", borderRadius: "2px" }} />
                <span style={{ fontWeight: "500" }}>Crime Incidents</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "4px", background: "#f97316", borderRadius: "2px" }} />
                <span style={{ fontWeight: "500" }}>Fire Incidents</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "4px", background: "#6366f1", borderRadius: "2px" }} />
                <span style={{ fontWeight: "500" }}>Total Incidents</span>
              </div>
            </div>
            
            {/* Summary stats */}
            <div style={{ 
              marginTop: "20px", 
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              padding: "16px",
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>Period</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#111827" }}>
                  {sortedMonths[0]?.month} - {sortedMonths[sortedMonths.length - 1]?.month}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>Total Months</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#111827" }}>
                  {sortedMonths.length}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>Avg Crime/Month</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#ef4444" }}>
                  {formatNumber(Math.round(sortedMonths.reduce((sum, m) => sum + m.crimeCnt, 0) / sortedMonths.length))}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "4px" }}>Avg Fire/Month</div>
                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#f97316" }}>
                  {formatNumber(Math.round(sortedMonths.reduce((sum, m) => sum + m.fireCnt, 0) / sortedMonths.length))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Query5;
    