// src/Query10.js
// Implements Query 10: GET /api/sffd/response-times
// Returns average / min / max SFFD response times per call type,
// with parameters: limit, sort_by, order.


import React, { useState, useEffect, useCallback } from "react";


function Query10() {
 const [limit, setLimit] = useState(50);
 const [sortBy, setSortBy] = useState("avg_response");
 const [order, setOrder] = useState("DESC");


 const [rows, setRows] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");


 // Function to fetch data
 const loadData = useCallback(async () => {
   // Validate limit
   if (limit < 1 || limit > 100) {
     setError("Limit must be between 1 and 100.");
     setRows([]);
     return;
   }


   setLoading(true);
   setError("");


   try {
     const url = `/api/sffd/response-times?limit=${limit}&sort_by=${sortBy}&order=${order}`;


     const res = await fetch(url);
     const json = await res.json();


     if (!res.ok) {
       throw new Error(json.error || "Failed to load SFFD response times");
     }


     setRows(json.data || []);
   } catch (err) {
     setError(err.message);
     setRows([]);
   } finally {
     setLoading(false);
   }
 }, [limit, sortBy, order]);


 // Auto-load on first render
 useEffect(() => {
   loadData();
 }, [loadData]);


 const sortFields = [
   { value: "avg_response", label: "Average Response Time" },
   { value: "min_response", label: "Minimum Response Time" },
   { value: "max_response", label: "Maximum Response Time" },
 ];


 const orderOptions = [
   { value: "ASC", label: "Ascending" },
   { value: "DESC", label: "Descending" },
 ];


 return (
   <div style={{ padding: "20px", maxWidth: "900px" }}>
     <h2>Query 10 — SFFD Response Times by Call Type</h2>
     <p>
       View SFFD response time statistics (avg/min/max minutes) for call types
       with at least 5 incidents.
     </p>


     {/* Filter controls */}
     <div style={{ marginBottom: "20px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
       {/* Limit input */}
       <label>
         Limit (1–100):{" "}
         <input
           type="number"
           value={limit}
           min="1"
           max="100"
           onChange={(e) => setLimit(Number(e.target.value))}
           style={{ width: "80px" }}
         />
       </label>


       {/* Sort By */}
       <label>
         Sort By:{" "}
         <select
           value={sortBy}
           onChange={(e) => setSortBy(e.target.value)}
           style={{ width: "180px" }}
         >
           {sortFields.map((opt) => (
             <option key={opt.value} value={opt.value}>
               {opt.label}
             </option>
           ))}
         </select>
       </label>


       {/* Order */}
       <label>
         Order:{" "}
         <select
           value={order}
           onChange={(e) => setOrder(e.target.value)}
           style={{ width: "120px" }}
         >
           {orderOptions.map((opt) => (
             <option key={opt.value} value={opt.value}>
               {opt.label}
             </option>
           ))}
         </select>
       </label>


       <button onClick={loadData} disabled={loading}>
         {loading ? "Loading..." : "Load Data"}
       </button>
     </div>


     {/* Error message */}
     {error && <div style={{ color: "red" }}>Error: {error}</div>}


     {/* No data */}
     {!loading && !error && rows.length === 0 && (
       <div>No response time data available.</div>
     )}


     {/* Data Table */}
     {rows.length > 0 && (
       <table
         border="1"
         cellPadding="8"
         style={{ borderCollapse: "collapse", width: "100%" }}
       >
         <thead>
           <tr>
             <th>Rank</th>
             <th>Call Type</th>
             <th>Total Calls</th>
             <th>Avg Response Time (min)</th>
             <th>Min Response Time (min)</th>
             <th>Max Response Time (min)</th>
           </tr>
         </thead>


         <tbody>
           {rows.map((row, idx) => (
             <tr key={idx}>
               <td>{row.rank}</td>
               <td>{row.call_type}</td>
               <td>{row.total_calls}</td>
               <td>{row.avg_response_minutes}</td>
               <td>{row.min_response_minutes}</td>
               <td>{row.max_response_minutes}</td>
             </tr>
           ))}
         </tbody>
       </table>
     )}
   </div>
 );
}


export default Query10;