// src/Query7.js
// Presents the top 10 fire "Primary Situation" entries and their most common
// associated "Action Taken Primary" values via GET /api/fire/primary_situation.

import React, { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "./utils";

function Query7() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/fire/primary_situation"));
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ||
            "Failed to load fire primary situations and response actions"
        );
      }

      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>
        Query 7 — Top 10 Primary Fire Scenarios and Associated Primary Response Actions
      </h2>
      <p>
        Displays the ten most frequent fire primary situations along with the
        most common primary action taken for each.
      </p>

      <div style={{ marginBottom: "16px" }}>
        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading…" : "Reload Data"}
        </button>
      </div>

      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {!loading && rows.length === 0 && !error && (
        <div>No fire situation data returned.</div>
      )}

      {rows.length > 0 && (
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th>Primary Situation</th>
              <th>Most Common Action Taken</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.primary_situation}</td>
                <td>{row.action_taken_primary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Query7;



