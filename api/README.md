# San Francisco Public Safety API

This API provides access to incident data from multiple sources in San Francisco, including 311 service requests, fire incidents, safety complaints, violations, service calls, and police incidents.

## Setup

1. Install dependencies:
```bash
pip install -r ../requirements.txt
```

2. Ensure the database files exist in `../sql_databases/`:
   - `processed_data.db`
   - `results.db`

## Running the Server

```bash
python queries.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### Query 1: All Incidents by Time

**Endpoint:** `GET /api/incidents/timeline`

**Description:** Returns all incidents from multiple data sources combined and ordered by time.

**Query Parameters:**
- `limit` (integer, optional): Max number of incidents to return
- `source` (string, optional): Filter by source table
  - Valid values: `311_service_requests`, `fire_incidents`, `fire_safety_complaints`, `fire_violations`, `sffd_service_calls`, `sfpd_incidents`

**Example Requests:**
```bash
# Get all incidents (default)
curl "http://localhost:5002/api/incidents/timeline"

# Get first 100 incidents
curl "http://localhost:5001/api/incidents/timeline?limit=100"

# Get fire incidents only
curl "http://localhost:5001/api/incidents/timeline?source=fire_incidents"

# Get first 50 fire incidents
curl "http://localhost:5001/api/incidents/timeline?source=fire_incidents&limit=50"
```

**Response:**
```json
{
  "data": [
    {
      "source_table": "string",
      "incident_time": "ISO timestamp",
      "incident_type": "string",
      "description": "string",
      "address": "string",
      "neighborhood": "string",
      "latitude": "number or null",
      "longitude": "number or null"
    }
  ],
  "count": "number",
  "sources": {
    "source_table_name": "count"
  }
}
```

---

### Query 2: Top Areas by Incident Count

**Endpoint:** `GET /api/neighborhood/top`

**Description:** Returns a ranked list of neighborhoods by total incident count, including distinct types and sources.

**Query Parameters:**
- `limit` (integer, optional, default=20): Max neighborhoods to return
- `min_incidents` (integer, optional): Minimum incidents threshold

**Example Requests:**
```bash
# Get top 20 neighborhoods (default)
curl "http://localhost:5001/api/neighborhood/top"

# Get top 10 neighborhoods
curl "http://localhost:5001/api/neighborhood/top?limit=10"

# Get neighborhoods with at least 5000 incidents
curl "http://localhost:5001/api/neighborhood/top?min_incidents=5000"

# Get top 5 neighborhoods with at least 10000 incidents
curl "http://localhost:5001/api/neighborhood/top?limit=5&min_incidents=10000"
```

**Response:**
```json
{
  "data": [
    {
      "neighborhood": "string",
      "incident_count": "number",
      "data_sources": "number",
      "incident_types": "number"
    }
  ],
  "total_neighborhoods": "number",
  "summary": {
    "average_incidents": "number",
    "median_incidents": "number",
    "max_incidents": "number",
    "min_incidents": "number"
  }
}
```

---

### Query 3: Time-Based Danger Analysis

**Endpoint:** `GET /api/neighborhoods/danger-analysis`

**Description:** Returns analysis of which neighborhoods are most dangerous at different times of day and day types.

**Query Parameters:**
- `neighborhood` (string, optional): Filter by specific neighborhood
- `time_period` (string, optional): Filter by time period
  - Valid values: `Morning`, `Afternoon`, `Evening`, `Night`
- `day_type` (string, optional): Filter by day type
  - Valid values: `Weekday`, `Weekend`
- `top_n` (integer, optional, default=10): Top N dangerous combinations to return

**Example Requests:**
```bash
# Get top 10 dangerous neighborhood-time combinations (default)
curl "http://localhost:5001/api/neighborhoods/danger-analysis"

# Get top 20 dangerous combinations
curl "http://localhost:5001/api/neighborhoods/danger-analysis?top_n=20"

# Get analysis for specific neighborhood
curl "http://localhost:5001/api/neighborhoods/danger-analysis?neighborhood=Mission"

# Get night-time analysis
curl "http://localhost:5001/api/neighborhoods/danger-analysis?time_period=Night"

# Get weekend analysis
curl "http://localhost:5001/api/neighborhoods/danger-analysis?day_type=Weekend"

# Get night-time weekend analysis for top 5 combinations
curl "http://localhost:5001/api/neighborhoods/danger-analysis?time_period=Night&day_type=Weekend&top_n=5"
```

**Response:**
```json
{
  "data": [
    {
      "neighborhood": "string",
      "time_period": "string",
      "day_type": "string",
      "incident_count": "number",
      "incident_types": "number",
      "pct_of_neighborhood_incidents": "number"
    }
  ],
  "summary": {
    "by_time_period": {
      "Night": "number",
      "Afternoon": "number",
      "Morning": "number",
      "Evening": "number"
    },
    "by_day_type": {
      "Weekday": "number",
      "Weekend": "number"
    },
    "top_dangerous_combinations": "array"
  },
  "total_records": "number"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters (with descriptive error message)
- `500 Internal Server Error`: Server error (with error details)

**Error Response Format:**
```json
{
  "error": "Error description"
}
```

## Data Sources

The API combines data from the following sources:
1. 311 Service Requests
2. Fire Incidents
3. Fire Safety Complaints
4. Fire Violations
5. SFFD Service Calls
6. SFPD Incidents

## Time Periods

Time periods are defined as:
- **Morning**: 6:00 AM - 11:59 AM
- **Afternoon**: 12:00 PM - 5:59 PM
- **Evening**: 6:00 PM - 9:59 PM
- **Night**: 10:00 PM - 5:59 AM

## Day Types

- **Weekday**: Monday - Friday
- **Weekend**: Saturday - Sunday
