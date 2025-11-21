// App.js
// Main entry point of the frontend dashboard.
// This component handles simple navigation between Query1, Query2, and Query3.
// Each button switches the active page using React state.

import React, { useState } from "react";
import Query1 from "./Query1";
import Query2 from "./Query2";
import Query3 from "./Query3";

function App() {
  // Current selected page (q1, q2, or q3)
  const [page, setPage] = useState("q1"); // Default: Query 1

  return (
    <div style={{ padding: "20px" }}>
      <h1>SF Public Safety Dashboard</h1>

      {/* Simple navigation buttons to switch between pages */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setPage("q1")}>Query 1</button>
        <button onClick={() => setPage("q2")}>Query 2</button>
        <button onClick={() => setPage("q3")}>Query 3</button>
      </div>

      {/* Conditional rendering based on selected page */}
      {page === "q1" && <Query1 />}
      {page === "q2" && <Query2 />}
      {page === "q3" && <Query3 />}
    </div>
  );
}

export default App;
