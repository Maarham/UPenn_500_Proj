//src/Query7.js
//this component implements Query 7:

// src/Query7.js
// Presents the top 10 fire "Primary Situation" entries and their most common
// associated "Action Taken Primary" values via GET /api/fire/primary_situation.

import React, { useState, useEffect, useCallback } from "react";

function Query7() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fire/primary_situation");
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
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h2>
        Query 7 - Top Fire Primary Situations & Common Response Actions
      </h2>
      <p>
        Displays the ten most frequent fire primary situations along with the
        most common primary action taken for each.
      </p>
      <div style={{ marginBottom: "16px" }}>
        <button onClick={loadData} disabled={loading}>
          {loading ? "Loading..." : "Load Data"}
        </button>
      </div>
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {!loading && rows.length === 0 && !error && (
        <div>No data available</div>
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
              <th>Common Response Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.primary_situation}</td>
                <td>{row.most_common_primary_action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Query7;
        