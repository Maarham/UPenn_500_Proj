// App.js
// Main entry point of the frontend dashboard.
// This component handles simple navigation between Query1, Query2, and Query3.
// Each button switches the active page using React state.

import React, { useState } from "react";
import Query1 from "./Query1";
import Query2 from "./Query2";
import Query3 from "./Query3";
import Query4 from "./Query4";
import Query5 from "./Query5";
import Query6 from "./Query6";
import Query7 from "./Query7";
import Query8 from "./Query8";
import Query9 from "./Query9";



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
        <button onClick={() => setPage("q4")}>Query 4</button>
        <button onClick={() => setPage("q5")}>Query 5</button>
        <button onClick={() => setPage("q6")}>Query 6</button>
        <button onClick={() => setPage("q7")}>Query 7</button>
        <button onClick={() => setPage("q8")}>Query 8</button>
        <button onClick={() => setPage("q9")}>Query 9</button>


      </div>

      {/* Conditional rendering based on selected page */}
      {page === "q1" && <Query1 />}
      {page === "q2" && <Query2 />}
      {page === "q3" && <Query3 />}
      {page === "q4" && <Query4 />}
      {page === "q5" && <Query5 />}
      {page === "q6" && <Query6 />}
      {page === "q7" && <Query7 />}
      {page === "q8" && <Query8 />}
      {page === "q9" && <Query9 />}
    </div>
  );
}

export default App;
