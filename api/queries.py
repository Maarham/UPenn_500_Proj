from flask import Flask, request, jsonify
import sqlite3
import os

app = Flask(__name__)

# Database paths
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'sql_databases', 'processed_data.db')
RESULTS_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'sql_databases', 'results.db')

def get_db_connection(db_path=DB_PATH):
    """Create a database connection"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


# Query 1: All Incidents by Time
@app.route('/api/incidents/timeline', methods=['GET'])
def getIncidentTimeline():
    """
    Returns all incidents from multiple data sources combined and ordered by time.
    Query Parameters:
    - limit (integer): Max number of incidents to return
    - source (string): Filter by source table
    """
    try:
        limit = request.args.get('limit', type=int)
        source = request.args.get('source', type=str)

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

        # Add source filter if provided
        if source:
            query = f"""
                SELECT * FROM (
                    {query}
                ) WHERE source_table = ?
                ORDER BY incident_time DESC
            """
            if limit:
                query += f" LIMIT {limit}"
            cursor.execute(query, (source,))
        else:
            query += " ORDER BY incident_time DESC"
            if limit:
                query += f" LIMIT {limit}"
            cursor.execute(query)

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
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
