export const SOURCE_OPTIONS = [
  { value: "311_service_requests", label: "311 Service Requests" },
  { value: "fire_incidents", label: "Fire Incidents" },
  { value: "fire_safety_complaints", label: "Fire Safety Complaints" },
  { value: "fire_violations", label: "Fire Violations" },
  { value: "sffd_service_calls", label: "SFFD Service Calls" },
  { value: "sfpd_incidents", label: "SFPD Incidents" },
];

export const SOURCE_COLORS = {
  "311_service_requests": "#10b981",
  fire_incidents: "#ef4444",
  fire_safety_complaints: "#f97316",
  fire_violations: "#a855f7",
  sffd_service_calls: "#0ea5e9",
  sfpd_incidents: "#6366f1",
};

export const CATEGORY_COLOR_PALETTE = [
  "#10b981",
  "#3b82f6",
  "#a855f7",
  "#f97316",
  "#ef4444",
  "#facc15",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#fb7185",
  "#8b5cf6",
  "#0ea5e9",
];

export const DEFAULT_CENTER = [37.773972, -122.431297];
export const DEFAULT_ZOOM = 12;

export const SF_BOUNDS = {
  north: 37.8324,
  south: 37.7035,
  west: -122.5155,
  east: -122.3549,
};

export const isWithinSFBounds = (lat, lon) => {
  return (
    lat >= SF_BOUNDS.south &&
    lat <= SF_BOUNDS.north &&
    lon >= SF_BOUNDS.west &&
    lon <= SF_BOUNDS.east
  );
};

export const parseDateSafely = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
});

export const formatDisplayDate = (date) => displayDateFormatter.format(date);

export const getSourceLabel = (value) =>
  SOURCE_OPTIONS.find((option) => option.value === value)?.label || value;

export const createInitialFilters = () => {
  return {
    limit: 100000,
    fromDate: "",
    toDate: "",
    sources: SOURCE_OPTIONS.map((option) => option.value),
    category: "All",
  };
};

export const inputStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "0.85rem",
  minWidth: "180px",
  outline: "none",
};

