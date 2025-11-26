// src/Query8.js
// Fetches incomplete fire inspections (missing end date) from
// GET /api/fire/incomplete_inspections with optional limit.

import React, { useState, useEffect, useCallback } from "react";

function Query8() {
    const [limit, setLimit] = useState(10);
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadData = useCallback(async () => {
        if (Number.isNaN(limit) || limit < 1 || limit > 100) {
            setError("Limit must be between 1 and 100.");
            setInspections([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/fire/incomplete_inspections?limit=${limit}`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(
                    json.error || "Failed to load incomplete fire inspections"
                );
            }

            setInspections(Array.isArray(json) ? json : []);
        } catch (err) {
            setError(err.message);
            setInspections([]);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div style={{ padding: "20px", maxWidth: "800px" }}>
            <h2>Query 8 - Incomplete Fire Inspections</h2>
            <p>
                Display the top incomplete fire inspections by inspection date.
            </p>
            <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
                <label>
                    Limit (1-100):{" "}
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={limit}
                        onChange={(e) =>
                            setLimit(Number.parseInt(e.target.value, 10) || 10)
                        }
                        style={{ width: "80px" }}
                    />
                </label>
                <button onClick={loadData} disabled={loading}>
                    {loading ? "Loading..." : "Load Data"}
                </button>
            </div>

            {error && <div style={{ color: "red" }}>Error: {error}</div>}
            {!loading && inspections.length === 0 && !error && (
                <div>No data available</div>
            )}

            {inspections.length > 0 && (
                <table
                    border="1"
                    cellPadding="8"
                    style={{ borderCollapse: "collapse", width: "100%" }}
                >
                    <thead>
                        <tr>
                            <th>Inspection Number</th>
                            <th>Start Date</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Type Description</th>
                            <th>Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inspections.map((row) => (
                            <tr key={row.inspection_number}>
                                <td>{row.inspection_number}</td>
                                <td>{row.inspection_start_date}</td>
                                <td>{row.inspection_status}</td>
                                <td>{row.inspection_type}</td>
                                <td>{row.inspection_type_description}</td>
                                <td>{row.address}</td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Query8;