//src/Query6.js
//this component implements Query 6:


import React, { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "./utils";

function Query6() {
    const [limit, setLimit] = useState("10");
    const [categories, setCategories] = useState([]);
    const [totalReturned, setTotalReturned] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadData = useCallback(async () => {
        const parsedLimit = Number.parseInt(limit, 10);
        if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            setError("Limit must be between 1 and 100");
            setCategories([]);
            setTotalReturned(0);
            return;
        }
        setLoading(true);
        setError("");
        try {
            const response = await fetch(getApiUrl(`/stats/top_crime_categories?limit=${parsedLimit}`));
            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.error || "Failed to load top crime categories");
            }
            const entries = Object.entries(json.top_crime_categories || {}).map(
                ([name, count]) => ({
                    name,
                    count,
                })
            );
            setCategories(entries);
            setTotalReturned(json.total?.categories_returned ?? entries.length);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unexpected error loading data";
            setError(message);
            setCategories([]);
            setTotalReturned(0);
        } finally {
            setLoading(false);
        }
    },[limit]);
    useEffect(()=>{
        loadData();
    },[loadData]);
    return (
        <div>
            <h2 style={{ marginTop: 0 }}>Query 6 - Top Crime Categories</h2>
            <p>
                view the top crime categories by incident count.
            </p>
            <div style={{marginBottom:"16px",display:"flex",gap:"12px"}}>
                <label>
                    Limit (1-100):{" "}
                    <input
                    type="number"
                    min="1"
                    max="100"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    style={{width:"80px"}}
                    />
                </label>
                <button onClick={loadData} disabled={loading}>
                    {loading ? "Loading..." : "Load Data"}
                </button>
            </div>
            {error && <div style={{color:"red"}}>Error: {error}</div>}
            {!loading && categories.length === 0 && !error && 
            (<div>No data available</div>)}

            {categories.length > 0 && (() => {
                const maxCount = Math.max(...categories.map(c => c.count));
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {categories.map((row, idx) => {
                            const barWidth = (row.count / maxCount) * 100;
                            const colors = [
                                "#ef4444", "#f97316", "#f59e0b", "#10b981", "#14b8a6",
                                "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899"
                            ];
                            return (
                                <div key={row.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ 
                                        minWidth: "200px", 
                                        fontSize: "0.85rem", 
                                        fontWeight: 500,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {row.name}
                                    </div>
                                    <div style={{ flex: 1, position: "relative", height: "32px" }}>
                                        <div
                                            style={{
                                                width: `${barWidth}%`,
                                                height: "100%",
                                                background: colors[idx % colors.length],
                                                borderRadius: "4px",
                                                transition: "width 0.3s ease",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                                paddingRight: "8px",
                                            }}
                                        >
                                            <span style={{ 
                                                color: "white", 
                                                fontSize: "0.8rem", 
                                                fontWeight: 600,
                                                textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                                            }}>
                                                {row.count.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}
            {categories.length > 0 && (
                <div style={{marginTop:"16px", fontSize: "0.85rem", color: "#6b7280"}}>
                    <strong>Total Categories:</strong> {totalReturned}
                </div>
            )}
        </div>
    );
}
export default Query6;