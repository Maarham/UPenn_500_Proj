from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import sqlite3
import datetime
import os
import random
import string
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderServiceError

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",  # Local development
            "https://sf-safety-portal.onrender.com"  # Production frontend
        ]
    }
})

# Database paths
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'sql_databases', 'processed_data.db')
RESULTS_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'sql_databases', 'results.db')

geolocator = Nominatim(user_agent="sf-public-safety-dashboard")

def get_db_connection(db_path=DB_PATH):
    """Create a database connection"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def parse_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def geocode_address(address, zip_code=None):
    if not address:
        return None, None

    query_parts = [address, "San Francisco", "CA"]
    if zip_code:
        query_parts.append(str(zip_code))
    query = ", ".join(query_parts)

    try:
        location = geolocator.geocode(query, timeout=5)
        if location:
            return location.latitude, location.longitude
    except GeocoderServiceError:
        pass

    return None, None


# Query 1: All Incidents by Time
@app.route('/api/incidents/timeline', methods=['GET'])
def getIncidentTimeline():
    """
    Returns all incidents from multiple data sources combined and ordered by time.
    Query Parameters:
    - limit (integer): Max number of incidents to return
    - source (string): Filter by source table
    - prioritize_coords (boolean): If true, prioritize records with valid coordinates (for map rendering)
    """
    try:
        limit = request.args.get('limit', type=int)
        source = request.args.get('source', type=str)
        prioritize_coords = request.args.get('prioritize_coords', 'false').lower() == 'true'

        # Valid source tables
        valid_sources = [
            '311_service_requests',
            'fire_incidents',
            'fire_safety_complaints',
            'fire_violations',
            'sffd_service_calls',
            'sfpd_incidents'
        ]

        # Validate source if provided
        if source and source not in valid_sources:
            return jsonify({"error": "Invalid source table"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Build the query
        query = """
            SELECT
                '311_service_requests' AS source_table,
                created_date AS incident_time,
                category AS incident_type,
                complaint_type AS description,
                incident_address AS address,
                neighborhood,
                latitude,
                longitude
            FROM "311_service_requests"
            WHERE created_date IS NOT NULL

            UNION ALL

            SELECT
                'fire_incidents' AS source_table,
                "Incident Date" AS incident_time,
                "Primary Situation" AS incident_type,
                "Action Taken Primary" AS description,
                Address AS address,
                "Analysis Neighborhood" AS neighborhood,
                NULL AS latitude,
                NULL AS longitude
            FROM fire_incidents
            WHERE "Incident Date" IS NOT NULL

            UNION ALL

            SELECT
                'fire_safety_complaints' AS source_table,
                "Received Date" AS incident_time,
                "Complaint Item Type Description" AS incident_type,
                Disposition AS description,
                Address AS address,
                "Neighborhood  District" AS neighborhood,
                NULL AS latitude,
                NULL AS longitude
            FROM fire_safety_complaints
            WHERE "Received Date" IS NOT NULL

            UNION ALL

            SELECT
                'fire_violations' AS source_table,
                "violation date" AS incident_time,
                "violation item description" AS incident_type,
                Status AS description,
                Address AS address,
                "neighborhood district" AS neighborhood,
                NULL AS latitude,
                NULL AS longitude
            FROM fire_violations
            WHERE "violation date" IS NOT NULL

            UNION ALL

            SELECT
                'sffd_service_calls' AS source_table,
                call_date AS incident_time,
                call_type AS incident_type,
                call_final_disposition AS description,
                address,
                supervisor_district AS neighborhood,
                latitude,
                longitude
            FROM sffd_service_calls
            WHERE call_date IS NOT NULL

            UNION ALL

            SELECT
                'sfpd_incidents' AS source_table,
                timestamp AS incident_time,
                category AS incident_type,
                descript AS description,
                address,
                pddistrict AS neighborhood,
                latitude,
                longitude
            FROM sfpd_incidents
            WHERE timestamp IS NOT NULL
        """

        # Wrap query in subquery for proper ordering
        wrapped_query = f"""
            SELECT * FROM (
                {query}
            )
        """
        
        # Add source filter if provided
        if source:
            wrapped_query = f"""
                SELECT * FROM (
                    {wrapped_query}
                ) WHERE source_table = ?
            """
            # Only prioritize coordinates if requested (for map rendering)
            if prioritize_coords:
                # Use CAST to handle string coordinates, and filter out 0.0 values
                wrapped_query += " ORDER BY CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND CAST(latitude AS REAL) != 0 AND CAST(longitude AS REAL) != 0 THEN 0 ELSE 1 END, incident_time DESC"
            else:
                wrapped_query += " ORDER BY incident_time DESC"
            if limit:
                wrapped_query += f" LIMIT {limit}"
            cursor.execute(wrapped_query, (source,))
        else:
            # Only prioritize coordinates if requested (for map rendering)
            if prioritize_coords:
                # Use CAST to handle string coordinates, and filter out 0.0 values
                wrapped_query += " ORDER BY CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL AND CAST(latitude AS REAL) != 0 AND CAST(longitude AS REAL) != 0 THEN 0 ELSE 1 END, incident_time DESC"
            else:
                wrapped_query += " ORDER BY incident_time DESC"
            if limit:
                wrapped_query += f" LIMIT {limit}"
            cursor.execute(wrapped_query)

        rows = cursor.fetchall()

        # Convert to list of dictionaries
        data = []
        sources = {}
        for row in rows:
            data.append({
                "source_table": row['source_table'],
                "incident_time": row['incident_time'],
                "incident_type": row['incident_type'],
                "description": row['description'],
                "address": row['address'],
                "neighborhood": row['neighborhood'],
                "latitude": row['latitude'],
                "longitude": row['longitude']
            })
            sources[row['source_table']] = sources.get(row['source_table'], 0) + 1

        conn.close()

        return jsonify({
            "data": data,
            "count": len(data),
            "sources": sources
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Query 2: Top Areas by Incident Count
@app.route('/api/neighborhood/top', methods=['GET'])
def getTopNeighborhoods():
    """
    Returns a ranked list of neighborhoods by total incident count.
    Query Parameters:
    - limit (integer): Max neighborhoods (default 20)
    - min_incidents (integer): Minimum incidents threshold
    """
    try:
        limit = request.args.get('limit', default=20, type=int)
        min_incidents = request.args.get('min_incidents', type=int)

        # Validate limit
        if limit <= 0:
            return jsonify({"error": "Invalid limit parameter. Must be positive integer."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Build query with results database table
        query = """
            SELECT
                neighborhood,
                COUNT(*) as incident_count,
                COUNT(DISTINCT source_table) as data_sources,
                COUNT(DISTINCT incident_type) as incident_types
            FROM (
                SELECT
                    '311_service_requests' AS source_table,
                    category AS incident_type,
                    neighborhood
                FROM "311_service_requests"
                WHERE neighborhood IS NOT NULL AND neighborhood != ''

                UNION ALL

                SELECT
                    'fire_incidents' AS source_table,
                    "Primary Situation" AS incident_type,
                    "Analysis Neighborhood" AS neighborhood
                FROM fire_incidents
                WHERE "Analysis Neighborhood" IS NOT NULL AND "Analysis Neighborhood" != ''

                UNION ALL

                SELECT
                    'fire_safety_complaints' AS source_table,
                    "Complaint Item Type Description" AS incident_type,
                    "Neighborhood  District" AS neighborhood
                FROM fire_safety_complaints
                WHERE "Neighborhood  District" IS NOT NULL AND "Neighborhood  District" != ''

                UNION ALL

                SELECT
                    'fire_violations' AS source_table,
                    "violation item description" AS incident_type,
                    "neighborhood district" AS neighborhood
                FROM fire_violations
                WHERE "neighborhood district" IS NOT NULL AND "neighborhood district" != ''

                UNION ALL

                SELECT
                    'sffd_service_calls' AS source_table,
                    call_type AS incident_type,
                    supervisor_district AS neighborhood
                FROM sffd_service_calls
                WHERE supervisor_district IS NOT NULL AND supervisor_district != ''

                UNION ALL

                SELECT
                    'sfpd_incidents' AS source_table,
                    category AS incident_type,
                    pddistrict AS neighborhood
                FROM sfpd_incidents
                WHERE pddistrict IS NOT NULL AND pddistrict != ''
            )
            GROUP BY neighborhood
        """

        # Add min_incidents filter if provided
        if min_incidents is not None:
            query += f" HAVING incident_count >= {min_incidents}"

        query += f" ORDER BY incident_count DESC LIMIT {limit}"

        cursor.execute(query)
        rows = cursor.fetchall()

        # Convert to list of dictionaries
        data = []
        incident_counts = []
        for row in rows:
            count = row['incident_count']
            data.append({
                "neighborhood": row['neighborhood'],
                "incident_count": count,
                "data_sources": row['data_sources'],
                "incident_types": row['incident_types']
            })
            incident_counts.append(count)

        # Calculate summary statistics
        summary = {}
        if incident_counts:
            summary = {
                "average_incidents": sum(incident_counts) / len(incident_counts),
                "median_incidents": sorted(incident_counts)[len(incident_counts) // 2],
                "max_incidents": max(incident_counts),
                "min_incidents": min(incident_counts)
            }

        conn.close()

        return jsonify({
            "data": data,
            "total_neighborhoods": len(data),
            "summary": summary
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Query 3: Time-Based Danger Analysis
@app.route('/api/neighborhoods/danger-analysis', methods=['GET'])
def getDangerAnalysis():
    """
    Returns analysis of which neighborhoods are most dangerous at different times of day and day types.
    Query Parameters:
    - neighborhood (string): Filter by neighborhood
    - time_period (string): Morning, Afternoon, Evening, Night
    - day_type (string): Weekday or Weekend
    - top_n (integer): Top N dangerous combinations (default 10)
    """
    try:
        neighborhood = request.args.get('neighborhood', type=str)
        time_period = request.args.get('time_period', type=str)
        day_type = request.args.get('day_type', type=str)
        top_n = request.args.get('top_n', default=10, type=int)

        # Validate parameters
        valid_time_periods = ['Morning', 'Afternoon', 'Evening', 'Night']
        valid_day_types = ['Weekday', 'Weekend']

        if time_period and time_period not in valid_time_periods:
            return jsonify({"error": f"Invalid time_period. Must be one of: {', '.join(valid_time_periods)}"}), 400

        if day_type and day_type not in valid_day_types:
            return jsonify({"error": f"Invalid day_type. Must be one of: {', '.join(valid_day_types)}"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Build query with time parsing
        query = """
            WITH time_parsed AS (
                SELECT
                    neighborhood,
                    incident_time,
                    incident_type,
                    CASE
                        WHEN CAST(SUBSTR(incident_time, 12, 2) AS INTEGER) BETWEEN 6 AND 11 THEN 'Morning'
                        WHEN CAST(SUBSTR(incident_time, 12, 2) AS INTEGER) BETWEEN 12 AND 17 THEN 'Afternoon'
                        WHEN CAST(SUBSTR(incident_time, 12, 2) AS INTEGER) BETWEEN 18 AND 21 THEN 'Evening'
                        ELSE 'Night'
                    END AS time_period,
                    CASE
                        WHEN CAST(strftime('%w', incident_time) AS INTEGER) IN (0, 6) THEN 'Weekend'
                        ELSE 'Weekday'
                    END AS day_type
                FROM (
                    SELECT
                        neighborhood,
                        created_date AS incident_time,
                        category AS incident_type
                    FROM "311_service_requests"
                    WHERE created_date IS NOT NULL AND neighborhood IS NOT NULL AND neighborhood != ''

                    UNION ALL

                    SELECT
                        "Analysis Neighborhood" AS neighborhood,
                        "Incident Date" AS incident_time,
                        "Primary Situation" AS incident_type
                    FROM fire_incidents
                    WHERE "Incident Date" IS NOT NULL AND "Analysis Neighborhood" IS NOT NULL AND "Analysis Neighborhood" != ''

                    UNION ALL

                    SELECT
                        "Neighborhood  District" AS neighborhood,
                        "Received Date" AS incident_time,
                        "Complaint Item Type Description" AS incident_type
                    FROM fire_safety_complaints
                    WHERE "Received Date" IS NOT NULL AND "Neighborhood  District" IS NOT NULL AND "Neighborhood  District" != ''

                    UNION ALL

                    SELECT
                        "neighborhood district" AS neighborhood,
                        "violation date" AS incident_time,
                        "violation item description" AS incident_type
                    FROM fire_violations
                    WHERE "violation date" IS NOT NULL AND "neighborhood district" IS NOT NULL AND "neighborhood district" != ''

                    UNION ALL

                    SELECT
                        supervisor_district AS neighborhood,
                        call_date AS incident_time,
                        call_type AS incident_type
                    FROM sffd_service_calls
                    WHERE call_date IS NOT NULL AND supervisor_district IS NOT NULL AND supervisor_district != ''

                    UNION ALL

                    SELECT
                        pddistrict AS neighborhood,
                        timestamp AS incident_time,
                        category AS incident_type
                    FROM sfpd_incidents
                    WHERE timestamp IS NOT NULL AND pddistrict IS NOT NULL AND pddistrict != ''
                )
            )
            SELECT
                neighborhood,
                time_period,
                day_type,
                COUNT(*) as incident_count,
                COUNT(DISTINCT incident_type) as incident_types,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY neighborhood), 2) as pct_of_neighborhood_incidents
            FROM time_parsed
            WHERE 1=1
        """

        params = []

        # Add filters
        if neighborhood:
            query += " AND neighborhood = ?"
            params.append(neighborhood)

        if time_period:
            query += " AND time_period = ?"
            params.append(time_period)

        if day_type:
            query += " AND day_type = ?"
            params.append(day_type)

        query += """
            GROUP BY neighborhood, time_period, day_type
            ORDER BY incident_count DESC
        """

        if top_n:
            query += f" LIMIT {top_n}"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Convert to list of dictionaries
        data = []
        time_period_summary = {}
        day_type_summary = {}

        for row in rows:
            data.append({
                "neighborhood": row['neighborhood'],
                "time_period": row['time_period'],
                "day_type": row['day_type'],
                "incident_count": row['incident_count'],
                "incident_types": row['incident_types'],
                "pct_of_neighborhood_incidents": row['pct_of_neighborhood_incidents']
            })

            # Accumulate for summary
            tp = row['time_period']
            dt = row['day_type']
            time_period_summary[tp] = time_period_summary.get(tp, 0) + row['incident_count']
            day_type_summary[dt] = day_type_summary.get(dt, 0) + row['incident_count']

        # Get top dangerous combinations
        top_dangerous = data[:min(5, len(data))]

        conn.close()

        return jsonify({
            "data": data,
            "summary": {
                "by_time_period": time_period_summary,
                "by_day_type": day_type_summary,
                "top_dangerous_combinations": top_dangerous
            },
            "total_records": len(data)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Query 4: Incident Type Breakdown
@app.route('/stats/incident_type_breakdown', methods=['GET'])
def incident_type_breakdown():
    """
    Returns the total and percentage of incidents for each type (crime, fire).
    Response (JSON):
    {
        "crime": {"total": int, "percentage": float},
        "fire": {"total": int, "percentage": float},
        "total_incidents": int
    }
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to get crime count
        crime_query = """
            SELECT COUNT(*) as count
            FROM sfpd_incidents
            WHERE timestamp IS NOT NULL
        """
        cursor.execute(crime_query)
        crime_count = cursor.fetchone()['count']

        # Query to get fire count
        fire_query = """
            SELECT COUNT(*) as count
            FROM fire_incidents
            WHERE "Incident Date" IS NOT NULL
        """
        cursor.execute(fire_query)
        fire_count = cursor.fetchone()['count']

        conn.close()

        # Calculate total
        total_incidents = crime_count + fire_count

        # Build response
        response = {}

        if crime_count > 0:
            response['crime'] = {
                'total': crime_count,
                'percentage': round((crime_count / total_incidents) * 100, 2) if total_incidents > 0 else 0
            }

        if fire_count > 0:
            response['fire'] = {
                'total': fire_count,
                'percentage': round((fire_count / total_incidents) * 100, 2) if total_incidents > 0 else 0
            }

        response['total_incidents'] = total_incidents

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Query 5: Monthly Incident Aggregation
@app.route('/stats/monthly_incidents', methods=['GET'])
def monthly_incidents():
    """
    Aggregates monthly counts of crime and fire incidents across years.
    Response (JSON):
    {
        "YYYY-MM": {
            "crime_cnt": int,
            "fire_cnt": int,
            "total_incidents": int
        },
        ...
    }
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to aggregate by month
        query = """
            WITH crime AS (
                SELECT
                    strftime('%Y-%m', timestamp) AS month,
                    COUNT(DISTINCT unique_key) AS cnt
                FROM sfpd_incidents
                WHERE timestamp IS NOT NULL
                GROUP BY 1
            ),
            fire AS (
                SELECT
                    strftime('%Y-%m', "Incident Date") AS month,
                    COUNT(*) AS cnt
                FROM fire_incidents
                WHERE "Incident Date" IS NOT NULL
                GROUP BY 1
            ),
            months AS (
                SELECT month FROM crime
                UNION
                SELECT month FROM fire
            )
            SELECT
                m.month,
                COALESCE(c.cnt, 0) AS crime_cnt,
                COALESCE(f.cnt, 0) AS fire_cnt,
                COALESCE(c.cnt, 0) + COALESCE(f.cnt, 0) AS total_incidents
            FROM months m
            LEFT JOIN crime c ON c.month = m.month
            LEFT JOIN fire f ON f.month = m.month
            ORDER BY m.month
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        # Build response as nested object with month as key
        response = {}
        for row in rows:
            month = row['month']
            response[month] = {
                'crime_cnt': row['crime_cnt'],
                'fire_cnt': row['fire_cnt'],
                'total_incidents': row['total_incidents']
            }

        conn.close()

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


## Query 6: Top Crime Categories
@app.route('/stats/top_crime_categories', methods=['GET'])
def top_crime_categories():
    '''
    Returns the top 10 most frequently reported crime categories from the SFPD incidents dataset as a single JSON object
    Query Parameters:
        limit(int)* - the number of categories to return. (default: 10)
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    limit_number = request.args.get('limit', default=10, type=int)
    if limit_number < 1 or limit_number > 100:
        return jsonify({"error": "Invalid 'limit' parameter. Must be between 1 and 100."}), 400
    query = f"""
    SELECT category, COUNT(*) AS cnt
    FROM sfpd_incidents
    GROUP BY category
    ORDER BY cnt DESC
    LIMIT {limit_number};
    """
    try:
        cursor.execute(query)
        rows = cursor.fetchall()

        if not rows:
            return jsonify({})
        data = dict(rows)
        result = {}
        result["top_crime_categories"] = data
        result["total_categories_returned"] = len(rows)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
## Query 7: Top 10 Primary Fire Scenarios and Associated Primary Response Actions
@app.route('/api/fire/primary_situation', methods=['GET'])
def primary_situation_common_action():
    '''
    This API gets a json array of {primary_situation: (string), 
                                    action_taken_primary: (string)} for fire incidents
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
    WITH top10_primarysituation AS (
        SELECT "Primary Situation", Count(*) as count
                FROM fire_incidents
                GROUP BY "Primary Situation"
                ORDER BY Count(*) DESC
                LIMIT 10),
        num_actions_per_situation AS	
                    (SELECT "Primary Situation", "Action Taken Primary", count(*) as count,
            (ROW_NUMBER() OVER(PARTITION BY "Primary Situation" ORDER BY count(*) DESC)) as row_num
        FROM fire_incidents
        WHERE "Primary Situation" IN (SELECT "Primary Situation" FROM top10_primarysituation)
        GROUP BY "Primary Situation", "Action Taken Primary"
        ORDER BY "Primary Situation", "Action Taken Primary", count(*) DESC)
    SELECT N."Primary Situation" as primary_situation, N."Action Taken Primary" as action_taken_primary
    FROM num_actions_per_situation N
    JOIN top10_primarysituation T ON N."Primary Situation" = T."Primary Situation"
    WHERE N.row_num = 1
    ORDER BY T.count DESC;
    
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    if not rows:
        return jsonify({})
    result = [
        {
            "primary_situation": r[0],
            "action_taken_primary": r[1]
        }
        for r in rows
    ]
    return jsonify(result)

## Query 8: generates a listing of inspections that are not completed, showing the most recent inspection start dates first.
@app.route('/api/fire/incomplete_inspections', methods=['GET'])
def incomplete_inspections():
    '''
    This api returns the incomplete inspections as an json array
    with the following keys: inspection_number (string), inspection_start_date (date), inspection_end_date (date), inspection_status (string), inspection_type (string), inspection_type_description (string), address (string), zipcode (string)
    Query Parameter:
        limit(int, optional) (default:10)
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    limit_number = request.args.get('limit', default=10, type=int)
    if limit_number < 1 or limit_number > 100:
        return jsonify({"error": "Invalid 'limit' parameter. Must be between 1 and 100."}), 400
    query = f"""
    SELECT "Inspection Number" as inspection_number, 
        "Inspection Start Date" as inspection_start_date, "Inspection End Date" as inspection_end_date, 
        "Inspection Status" as inspection_status, 
        "Inspection Type" as inspection_type, 
        "Inspection Type Description" as inspection_type_description, 
        "Address" as address, "Zipcode" as zipcode
    FROM  fire_inspections
    WHERE inspection_number is NOT NULL and inspection_end_date is NULL
    ORDER BY inspection_start_date DESC
    LIMIT {limit_number};
    """
    try:
        cursor.execute(query)
        rows = cursor.fetchall()

        if not rows:
            return jsonify({})
        result = [
            {
                "inspection_number": r[0],
                "inspection_start_date": r[1],
                "inspection_end_date": r[2],
                "inspection_status": r[3],
                "inspection_type": r[4],
                "inspection_type_description": r[5],
                "address": r[6],
                "zipcode": r[7]
            }
            for r in rows
        ]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

## Query 9:  Top Fire Neighborhoods
@app.route('/api/fire/top-neighborhoods', methods=['GET'])
def getTopFireNeighborhoods():
    '''
    Returns, for each of the latest M years (default: 3), 
    the top N neighborhoods (default: 10) with the most fire incidents, plus each neighborhood’s percentage share within that year.
    Query Parameter:
        limit (integer) - Maximum number of neighborhoods per year to return (1 - 100, default: 10)
        years (integer) - Number of recent years to include (1 - 5, default: 3)
    Expected Behavior:
        Case 1: No query params provided
        Return top 10 neighborhoods for each of the latest 3 years.
        Order by year (descending), then by total_fires (descending).
        Include percentage of total fires for each neighborhood within its year.
        Case 2: limit params provided
        Return up to the specific number of neighborhoods per year.
        Must be a positive integer between 1 and 100 (1 - 100).
        Case 3: years params provided
        Return data for the specified number of most recent years.
        Must be a positive integer between 1 and 5 (1 - 5).
        Case 4: Both limit and years params are provided
        Apply both parameters to return top N neighborhoods for the latest M years.
        Case 5: Invalid limit params (not a positive integer, < 1, or > 100)
        Return with 400 status and error message: { "error": "Invalid limit parameter. Must be between 1 and 100" }.
        Case 6: Invalid years params (not a positive integer, < 1, or > 5)
        Return with 400 status and error message: { "error": "Invalid years parameter. Must be between 1 and 5" }.
        Case 7: No fire incident data available
        Return 200 status with empty data array and message in summary: {"data": [], "summary": {"message": "No fire incident data available"}}

    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    limit_number = request.args.get('limit', default=10, type=int)
    if limit_number < 1 or limit_number > 100:
        return jsonify({"error": "Invalid 'limit' parameter. Must be between 1 and 100."}), 400
    year = request.args.get('years', default = 3, type = int)
    if year < 1 or year > 5:
        return jsonify({"error": "Invalid 'year' parameter. Must be between 1 and 5."}), 400
    # Top 10 neighborhoods with the most fire incidents for each of the latest three years
    query = f"""
    WITH neighborhood_stats AS (
    SELECT
    CAST(strftime('%Y', "Incident Date") AS INTEGER) AS year,
    "Analysis Neighborhood" AS neighborhood,
    COUNT(*) AS total_fires,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fire_incidents WHERE "Analysis Neighborhood" IS NOT NULL AND "Analysis Neighborhood" != ''), 2) AS percentage_of_total
    FROM fire_incidents
    WHERE "Analysis Neighborhood" IS NOT NULL
    AND "Analysis Neighborhood" != ''
    GROUP BY year, "Analysis Neighborhood"
    ),
    ranked AS (
    SELECT
    year,
    ROW_NUMBER() OVER(PARTITION BY year ORDER BY total_fires DESC) AS rank,
    neighborhood,
    total_fires,
    percentage_of_total
    FROM neighborhood_stats
    ORDER BY year DESC, total_fires DESC
    )
    SELECT
    year,
    rank,
    neighborhood,
    total_fires,
    percentage_of_total
    FROM ranked
    WHERE year >= (SELECT MAX(year) FROM neighborhood_stats) - {year-1}
    AND rank <= {limit_number}
    ORDER BY year DESC, rank ASC;
    """
    try:
        cursor.execute(query)
        rows = cursor.fetchall()

        if not rows:
            return jsonify( {"data": [], "summary": {"message": "No fire incident data available"}}), 200
        data = [
            {
            "year": r[0],
            "rank": r[1],
            "neighborhood": r[2],
            "total_fires": r[3],
            'percentage_of_total': r[4]
            }
            for r in rows
        ]
        result = {}
        result["data"] = data
        result["summary"] = {"years_analyzed": list(range(rows[-1][0], rows[0][0]+1)),
                            "limit_per_year": limit_number,
                            "years_requested": year,
                            "total_records": len(rows)}
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

## Query 10: SFFD Response Time by Call Type
@app.route('/api/sffd/response-times', methods=['GET'])
def getResponseTimes():
    '''
    Returns the average, minimum, and maximum response time (in minutes) for each SFFD call type, 
    sorted by average response time descending. 
    Response times are calculated in minutes from received timestamp to on-scene timestamp. Only includes call types with at least 5 incidents.
    Query Parameter(s):
        limit (integer) - Maximum number of call types to return (1 - 100,  default: 50)
        sort_by (string) - Sort field: 'avg_response', 'min_response', 'max_response' (default: 'avg_response')
        order (string) - Sort direction: 'ASC' or 'DESC' (default: 'DESC')
    '''
    conn = get_db_connection()
    cursor = conn.cursor()
    limit_number = request.args.get('limit', default=50, type=int)
    sort_by = request.args.get('sort_by', default = 'avg_response', type = str)
    order = request.args.get('order', default = 'DESC', type = str)
    if limit_number < 1 or limit_number > 100:
        return jsonify({"error": "Invalid 'limit' parameter. Must be between 1 and 100."}), 400
    if sort_by not in ['avg_response', 'min_response', 'max_response']:
        return jsonify({"error": "Invalid 'sort_by' parameter. Must be either of these options: ['avg_response', 'min_response', 'max_response']."}), 400
    if order not in ['ASC', 'DESC']:
        return jsonify({"error": "Invalid 'order' parameter. Must be either of these options: ['ASC', 'DESC']."}), 400
    sort_by = sort_by + '_minutes'
    query = f"""
        WITH stats AS (
            SELECT
                call_type,
                COUNT(*) AS total_calls,
                ROUND(AVG((julianday(on_scene_timestamp) - julianday(received_timestamp)) * 1440), 2)
                    AS avg_response_minutes,
                ROUND(MIN((julianday(on_scene_timestamp) - julianday(received_timestamp)) * 1440), 2)
                    AS min_response_minutes,
                ROUND(MAX((julianday(on_scene_timestamp) - julianday(received_timestamp)) * 1440), 2)
                    AS max_response_minutes
            FROM sffd_service_calls
            WHERE
                call_type IS NOT NULL
                AND call_type != ''
                AND received_timestamp IS NOT NULL
                AND on_scene_timestamp IS NOT NULL
                AND on_scene_timestamp >= received_timestamp
            GROUP BY call_type
            HAVING COUNT(*) >= 5
        ),
        sorted AS (
            SELECT
                *,
                ROW_NUMBER() OVER (ORDER BY {sort_by} {order}) AS rank
            FROM stats
        )
        SELECT
            rank,
            call_type,
            total_calls,
            avg_response_minutes,
            min_response_minutes,
            max_response_minutes
        FROM sorted
        ORDER BY rank
        LIMIT {limit_number};
    """

    try:
        cursor.execute(query)
        rows = cursor.fetchall()

        if not rows:
            return {"data": [], "summary": {"message": "No call types found with at least 5 incidents"}}, 200
        data = [
            {
            "rank": r[0],
            "call_type": r[1],
            "total_calls": r[2],
            "avg_response_minutes": r[3],
            'min_response_minutes': r[4],
            "max_response_minutes": r[5]
            }
            for r in rows
        ]
        result = {}
        result["data"] = data
        result["summary"] = {"limit": limit_number,
                            "sort_by": sort_by,
                            "order": order,
                            "total_records": len(rows)}
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


### INCIDENT REPORT PAGE API FOR CREATING INCIDENT INTO DATABASES
## CREATE 311 SERVICE REQUEST
@app.route('/api/311-requests', methods = ['POST'])
def create_311_service_request():
    """
    columns in the "311_service_requests" table: ['unique_key', 'created_date', 'closed_date', 
    'resolution_action_updated_date', 'status', 'status_notes', 'agency_name', 'category', 
    'complaint_type', 'descriptor', 'incident_address', 'supervisor_district', 'neighborhood', 
    'location', 'source', 'media_url', 'latitude', 'longitude', 'police_district']

    """
    conn = get_db_connection()
    cursor = conn.cursor()

    ## auto-generated values to enter
    created_timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S+00:00')
    status = "Open"
    source = 'Web'
    ## generating unique key
    cursor.execute('''SELECT DISTINCT unique_key FROM "311_service_requests" ''')
    existing_keys = [row[0] for row in cursor.fetchall()]
    existing_keys_set = set(existing_keys)
    def generate_unique_key():
        k = 0
        default_length_of_digits = 10
        while k < 10:
            new_key = ''.join(random.choices(string.digits, k=default_length_of_digits))
            
            # Check if it doesn't exist
            if new_key not in existing_keys_set:
                return new_key
            k +=1
    unique_key = generate_unique_key()

    ## get data
    data = request.get_json()
    required_fields = ["category", "complaint_type", "descriptor", "incident_address", "neighborhood"]
    for field in required_fields:
        if field not in data or not data.get(field):
            return jsonify({"error": f"Missing required field '{field}'"}), 400
    try:
        latitude = parse_float(data.get("latitude"))
        longitude = parse_float(data.get("longitude"))

        if latitude is None or longitude is None:
            zip_code = data.get("zip_code")
            geocoded_lat, geocoded_lon = geocode_address(data.get("incident_address"), zip_code)
            if latitude is None:
                latitude = geocoded_lat
            if longitude is None:
                longitude = geocoded_lon

        query = """
        INSERT INTO "311_service_requests" (
            unique_key, created_date, closed_date,
            resolution_action_updated_date, status, status_notes,
            agency_name, category, complaint_type, descriptor,
            incident_address, supervisor_district, neighborhood,
            location, source, media_url, latitude, longitude, police_district
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *;
        """
        values = (
            unique_key,                   # unique_key
            created_timestamp,            # created_date
            None,                         # closed_date
            None,                         # resolution_action_updated_date
            status,                       # status
            None,                         # status_notes
            None,                         # agency_name
            data.get('category'),
            data.get('complaint_type'),
            data.get('descriptor'),
            data.get('incident_address'),
            None,                         # supervisor_district
            data.get('neighborhood'),
            None,                         # location
            source,
            None,                         # media_url
            latitude,
            longitude,
            None                          # police_district
        )
        cursor.execute(query, values)
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        return jsonify({
            'success': True,
            'message': '311 service request created successfully',
            'data': dict(result)
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

## add sfpd incident
@app.route('/api/sfpd_incidents', methods = ['POST'])
def create_sfpd_incident():
    """
    columns in the "sfpd_incidents" table: 
    ['unique_key', 'category', 'descript', 'dayofweek', 
    'pddistrict', 'resolution', 'address', 'longitude', 
    'latitude', 'location', 'pdid', 'timestamp']

    """
    conn = get_db_connection()
    cursor = conn.cursor()


    ## auto-generated values to enter
    created_timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S+00:00')
    status = "Open"
    source = 'Web'
    ## generating unique key
    cursor.execute('''SELECT DISTINCT unique_key FROM sfpd_incidents ''')
    existing_keys = [row[0] for row in cursor.fetchall()]
    existing_keys_set = set(existing_keys)
    def generate_unique_key():
        k = 0
        default_length_of_digits = 10
        while k < 10:
            new_key = ''.join(random.choices(string.digits, k=default_length_of_digits))
            
            # Check if it doesn't exist
            if new_key not in existing_keys_set:
                return new_key
            k +=1
    unique_key = generate_unique_key()

    ## get data
    data = request.get_json()
    required_fields = ["category", "descript", "address"]
    for field in required_fields:
        if field not in data or not data.get(field):
            return jsonify({"error": f"Missing required field '{field}'"}), 400
    try:
        query = """
            INSERT INTO sfpd_incidents (
                unique_key, category, descript, dayofweek, pddistrict,
                resolution, address, longitude, latitude, location, pdid, timestamp
            )
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            RETURNING *;
        """

        values = (
            unique_key,
            data.get("category"),
            data.get("descript"),
            data.get("dayofweek"),
            data.get("pddistrict"),
            data.get("resolution"),
            data.get("address"),
            data.get("longitude"),
            data.get("latitude"),
            data.get("location"),
            data.get("pdid"),
            data.get("timestamp") or created_timestamp
        )
        cursor.execute(query, values)
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        return jsonify({
            'success': True,
            'message': 'SFPD incident created successfully',
            'data': dict(result)
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/fire-incidents', methods=['POST'])
def create_fire_incident():
    data = request.get_json()

    required_fields = ["Address", "Incident Date", "Primary Situation", "Analysis Neighborhood"]
    for field in required_fields:
        if field not in data or not data.get(field):
            return jsonify({"error": f"Missing required field '{field}'"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    ## generating unique incident number
    cursor.execute('''SELECT DISTINCT "Incident Number" FROM fire_incidents ''')
    existing_keys = [row[0] for row in cursor.fetchall()]
    existing_keys_set = set(existing_keys)
    def generate_unique_key():
        k = 0
        default_length_of_digits = 10
        while k < 10:
            new_key = ''.join(random.choices(string.digits, k=default_length_of_digits))
            
            # Check if it doesn't exist
            if new_key not in existing_keys_set:
                return new_key
            k +=1
    incident_number = generate_unique_key()

    query = """
        INSERT INTO fire_incidents (
            "Incident Number", "Exposure Number", "ID", "Address",
            "Incident Date", "Call Number", "Alarm DtTm", "Arrival DtTm", "Close DtTm",
            "City", "ZIP Code", "Suppression Units", "Suppression Personnel",
            "EMS Units", "EMS Personnel", "Other Units", "Other Personnel",
            "Fire Fatalities", "Fire Injuries", "Civilian Fatalities",
            "Civilian Injuries", "Number of Alarms", "Primary Situation",
            "Mutual Aid", "Action Taken Primary", "Action Taken Secondary",
            "Property Use", "Supervisor District", "Analysis Neighborhood"
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
                  ?,?,?,?,?,?,?,?,?,?)
        RETURNING *;
    """

    values = (
        incident_number,
        data.get("Exposure Number"),
        data.get("ID"),
        data.get("Address"),
        data.get("Incident Date"),
        data.get("Call Number"),
        data.get("Alarm DtTm"),
        data.get("Arrival DtTm"),
        data.get("Close DtTm"),
        data.get("City"),
        data.get("ZIP Code"),
        data.get("Suppression Units"),
        data.get("Suppression Personnel"),
        data.get("EMS Units"),
        data.get("EMS Personnel"),
        data.get("Other Units"),
        data.get("Other Personnel"),
        data.get("Fire Fatalities"),
        data.get("Fire Injuries"),
        data.get("Civilian Fatalities"),
        data.get("Civilian Injuries"),
        data.get("Number of Alarms"),
        data.get("Primary Situation"),
        data.get("Mutual Aid"),
        data.get("Action Taken Primary"),
        data.get("Action Taken Secondary"),
        data.get("Property Use"),
        data.get("Supervisor District"),
        data.get("Analysis Neighborhood")
    )

    try:
        cursor.execute(query, values)
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        return jsonify({"success": True, 
                    "message": "Fire Incident created successfully",
                 "data": dict(result)}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)