import React, { useState } from "react";
import TimelineView from "./TimelineView";
import TopNeighborhoodsView from "./TopNeighborhoodsView";
import DangerAnalysisView from "./DangerAnalysisView";

function App() {
  const tabs = [
    { id: "timeline", label: "Timeline", component: TimelineView },
    {
      id: "top-neighborhoods",
      label: "Top Neighborhoods",
      component: TopNeighborhoodsView,
    },
    { id: "danger-analysis", label: "Danger Analysis", component: DangerAnalysisView },
  ];

  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTabId)?.component ?? TimelineView;

  const handleTabChange = (newTabId) => {
    if (newTabId !== activeTabId) {
      setActiveTabId(newTabId);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <h1>San Francisco Public Safety Dashboard</h1>
      <div style={{ marginBottom: "16px" }}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            label={tab.label}
            isActive={tab.id === activeTabId}
            onClick={() => handleTabChange(tab.id)}
          />
        ))}
      </div>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          minHeight: "300px",
        }}
      >
        <ActiveComponent />
      </div>
    </div>
  );
}

function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        marginRight: "8px",
        padding: "8px 12px",
        borderRadius: "999px",
        border: isActive ? "2px solid #007bff" : "1px solid #ccc",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      {label}
    </button>
    );
}

export default App;