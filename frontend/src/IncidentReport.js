import React, { useMemo, useState } from "react";
import { getApiUrl, inputStyle } from "./utils";

const INCIDENT_TYPES = [
  { id: "311", label: "311 Service Request" },
  { id: "sfpd", label: "SFPD Incident" },
  { id: "fire", label: "Fire Incident" },
];

const FORM_CONFIG = {
  "311": {
    endpoint: "/api/311-requests",
    description: "Submit a new 311 service request observed within San Francisco.",
    initialState: {
      category: "",
      complaint_type: "",
      descriptor: "",
      incident_address: "",
      neighborhood: "",
      zip_code: "",
      latitude: "",
      longitude: "",
    },
    requiredFields: [
      "category",
      "complaint_type",
      "descriptor",
      "incident_address",
      "neighborhood",
    ],
    fields: [
      { name: "category", label: "Category", placeholder: "e.g., Street and Sidewalk", required: true },
      {
        name: "complaint_type",
        label: "Complaint Type",
        placeholder: "e.g., Tree Maintenance",
        required: true,
      },
      {
        name: "descriptor",
        label: "Descriptor",
        placeholder: "e.g., Tree Trimming Needed",
        required: true,
      },
      {
        name: "incident_address",
        label: "Incident Address",
        placeholder: "e.g., 123 Main St",
        required: true,
      },
      {
        name: "neighborhood",
        label: "Neighborhood",
        placeholder: "e.g., Mission",
        required: true,
      },
      {
        name: "zip_code",
        label: "ZIP Code",
        placeholder: "e.g., 94103",
      },
      {
        name: "latitude",
        label: "Latitude (optional)",
        placeholder: "e.g., 37.7749",
      },
      {
        name: "longitude",
        label: "Longitude (optional)",
        placeholder: "e.g., -122.4194",
      },
    ],
  },
  sfpd: {
    endpoint: "/api/sfpd_incidents",
    description: "Report a police incident to the SFPD dataset.",
    initialState: {
      category: "",
      descript: "",
      address: "",
      dayofweek: "",
      pddistrict: "",
      resolution: "",
      latitude: "",
      longitude: "",
    },
    requiredFields: ["category", "descript", "address"],
    fields: [
      { name: "category", label: "Category", placeholder: "e.g., Larceny Theft", required: true },
      {
        name: "descript",
        label: "Description",
        type: "textarea",
        placeholder: "e.g., Describe what happened",
        required: true,
      },
      { name: "address", label: "Address", placeholder: "e.g., 456 Market St", required: true },
      {
        name: "dayofweek",
        label: "Day of Week",
        placeholder: "e.g., Monday",
      },
      {
        name: "pddistrict",
        label: "Police District",
        placeholder: "e.g., Southern",
      },
      {
        name: "resolution",
        label: "Resolution",
        placeholder: "e.g., Open or Pending",
      },
      {
        name: "latitude",
        label: "Latitude",
        placeholder: "e.g., 37.77",
      },
      {
        name: "longitude",
        label: "Longitude",
        placeholder: "e.g., -122.43",
      },
    ],
  },
  fire: {
    endpoint: "/api/fire-incidents",
    description: "Report a fire-related incident handled by SFFD.",
    initialState: {
      Address: "",
      "Incident Date": "",
      "Primary Situation": "",
      "Analysis Neighborhood": "",
      City: "",
      "ZIP Code": "",
      "Number of Alarms": "",
    },
    requiredFields: ["Address", "Incident Date", "Primary Situation", "Analysis Neighborhood"],
    fields: [
      { name: "Address", label: "Address", placeholder: "e.g., 789 Pine St", required: true },
      {
        name: "Incident Date",
        label: "Incident Date",
        placeholder: "e.g., 2024-03-01 14:05:00",
        required: true,
      },
      {
        name: "Primary Situation",
        label: "Primary Situation",
        placeholder: "e.g., Building fire",
        required: true,
      },
      {
        name: "Analysis Neighborhood",
        label: "Analysis Neighborhood",
        placeholder: "e.g., SOMA",
        required: true,
      },
      {
        name: "City",
        label: "City",
        placeholder: "e.g., San Francisco",
      },
      {
        name: "ZIP Code",
        label: "ZIP Code",
        placeholder: "e.g., 94103",
      },
      {
        name: "Number of Alarms",
        label: "Number of Alarms",
        placeholder: "e.g., 1",
      },
    ],
  },
};

const successNoticeStyle = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #86efac",
  background: "rgba(134,239,172,0.2)",
  color: "#166534",
  fontSize: "0.9rem",
};

const errorNoticeStyle = {
  ...successNoticeStyle,
  border: "1px solid #fecaca",
  background: "rgba(254,202,202,0.25)",
  color: "#991b1b",
};

function IncidentReport() {
  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0].id);
  const [forms, setForms] = useState(() => ({
    "311": { ...FORM_CONFIG["311"].initialState },
    sfpd: { ...FORM_CONFIG.sfpd.initialState },
    fire: { ...FORM_CONFIG.fire.initialState },
  }));
  const [status, setStatus] = useState({
    loading: false,
    successMessage: "",
    errorMessage: "",
  });

  const activeConfig = useMemo(() => FORM_CONFIG[incidentType], [incidentType]);
  const activeValues = forms[incidentType];

  const handleFieldChange = (field, value) => {
    setForms((prev) => ({
      ...prev,
      [incidentType]: {
        ...prev[incidentType],
        [field]: value,
      },
    }));
  };

  const handleReset = () => {
    setForms((prev) => ({
      ...prev,
      [incidentType]: { ...activeConfig.initialState },
    }));
    setStatus({ loading: false, successMessage: "", errorMessage: "" });
  };

  const validateFields = () => {
    const missing = activeConfig.requiredFields.filter((field) => {
      const value = activeValues[field];
      return value === undefined || value === null || `${value}`.trim() === "";
    });

    if (missing.length === 0) return null;

    const missingLabels = missing
      .map((field) => activeConfig.fields.find((f) => f.name === field)?.label || field)
      .join(", ");
    return `Please complete the required fields: ${missingLabels}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateFields();
    if (validationError) {
      setStatus({ loading: false, successMessage: "", errorMessage: validationError });
      return;
    }

    setStatus({ loading: true, successMessage: "", errorMessage: "" });
    try {
      const response = await fetch(getApiUrl(activeConfig.endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activeValues),
      });
      const json = await response.json();

      if (!response.ok || json.success === false) {
        throw new Error(json.error || json.message || "Failed to submit incident");
      }

      setStatus({
        loading: false,
        successMessage:
          json.message ||
          'Incident submitted successfully. Return to the Timeline tab and run "Search in this area" to view it.',
        errorMessage: "",
      });
      setForms((prev) => ({
        ...prev,
        [incidentType]: { ...activeConfig.initialState },
      }));
    } catch (error) {
      setStatus({
        loading: false,
        successMessage: "",
        errorMessage: error.message || "Submission failed. Please try again later.",
      });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h2 style={{ margin: "0 0 8px 0" }}>Report a Public Safety Incident</h2>
        <p style={{ margin: 0, color: "#4b5563", fontSize: "0.9rem" }}>
          Pick an incident type, fill in the required details, and submit. After a successful submission, switch to the Timeline tab and click "Search in this area" to refresh the live data.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {INCIDENT_TYPES.map((option) => {
          const isActive = incidentType === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setIncidentType(option.id);
                setStatus({ loading: false, successMessage: "", errorMessage: "" });
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                border: isActive ? "2px solid #0ea5e9" : "1px solid #d1d5db",
                background: isActive ? "rgba(14,165,233,0.15)" : "white",
                color: isActive ? "#0369a1" : "#374151",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "16px",
        }}
      >
        <div style={{ marginBottom: "12px", color: "#4b5563", fontSize: "0.9rem" }}>
          {activeConfig.description}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {incidentType === "311" && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px dashed #cbd5f5",
                background: "rgba(219,234,254,0.35)",
                color: "#1d4ed8",
                fontSize: "0.82rem",
              }}
            >
              Provide either exact coordinates or just a San Francisco ZIP code—we will attempt to geocode the address automatically so that the incident can be plotted on the map.
            </div>
          )}

          {activeConfig.fields.map((field) => {
            const InputComponent = field.type === "textarea" ? "textarea" : "input";
            const fieldStyle =
              field.type === "textarea"
                ? { ...inputStyle, minHeight: "90px", minWidth: "100%", resize: "vertical" }
                : inputStyle;

            return (
              <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>
                  {field.label}
                  {field.required ? <span style={{ color: "#ef4444" }}> *</span> : null}
                </span>
                <InputComponent
                  style={fieldStyle}
                  type={field.inputType || "text"}
                  placeholder={field.placeholder}
                  value={activeValues[field.name] || ""}
                  onChange={(event) => handleFieldChange(field.name, event.target.value)}
                />
              </label>
            );
          })}

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={status.loading}
              style={{
                padding: "12px 24px",
                borderRadius: "999px",
                border: "none",
                background: "#22c55e",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {status.loading ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={status.loading}
              style={{
                padding: "12px 24px",
                borderRadius: "999px",
                border: "1px solid #d1d5db",
                background: "white",
                color: "#374151",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {status.successMessage && (
        <div style={successNoticeStyle}>
          {status.successMessage} Return to the Timeline tab, ensure the relevant source is selected, and click "Search in this area" to refresh.
        </div>
      )}
      {status.errorMessage && <div style={errorNoticeStyle}>{status.errorMessage}</div>}
    </div>
  );
}

export default IncidentReport;

