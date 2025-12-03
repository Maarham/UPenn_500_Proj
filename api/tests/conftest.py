import pytest
import sqlite3
import os
import sys
import tempfile
from unittest.mock import Mock, patch

# Add parent directory to path to import queries module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import queries


@pytest.fixture
def app():
    """Create and configure a test Flask app instance"""
    queries.app.config['TESTING'] = True
    return queries.app


@pytest.fixture
def client(app):
    """Create a test client for the Flask app"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test CLI runner for the Flask app"""
    return app.test_cli_runner()


@pytest.fixture
def test_db():
    """
    Create a temporary test database with sample data
    """
    # Create a temporary database file
    db_fd, db_path = tempfile.mkstemp(suffix='.db')

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create sample tables
    cursor.execute('''
        CREATE TABLE "311_service_requests" (
            unique_key TEXT PRIMARY KEY,
            created_date TEXT,
            closed_date TEXT,
            resolution_action_updated_date TEXT,
            status TEXT,
            status_notes TEXT,
            agency_name TEXT,
            category TEXT,
            complaint_type TEXT,
            descriptor TEXT,
            incident_address TEXT,
            supervisor_district TEXT,
            neighborhood TEXT,
            location TEXT,
            source TEXT,
            media_url TEXT,
            latitude REAL,
            longitude REAL,
            police_district TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE fire_incidents (
            "Incident Number" TEXT PRIMARY KEY,
            "Exposure Number" TEXT,
            "ID" TEXT,
            "Address" TEXT,
            "Incident Date" TEXT,
            "Call Number" TEXT,
            "Alarm DtTm" TEXT,
            "Arrival DtTm" TEXT,
            "Close DtTm" TEXT,
            "City" TEXT,
            "ZIP Code" TEXT,
            "Suppression Units" INTEGER,
            "Suppression Personnel" INTEGER,
            "EMS Units" INTEGER,
            "EMS Personnel" INTEGER,
            "Other Units" INTEGER,
            "Other Personnel" INTEGER,
            "Fire Fatalities" INTEGER,
            "Fire Injuries" INTEGER,
            "Civilian Fatalities" INTEGER,
            "Civilian Injuries" INTEGER,
            "Number of Alarms" INTEGER,
            "Primary Situation" TEXT,
            "Mutual Aid" TEXT,
            "Action Taken Primary" TEXT,
            "Action Taken Secondary" TEXT,
            "Property Use" TEXT,
            "Supervisor District" TEXT,
            "Analysis Neighborhood" TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE fire_safety_complaints (
            "Received Date" TEXT,
            "Complaint Item Type Description" TEXT,
            Disposition TEXT,
            Address TEXT,
            "Neighborhood  District" TEXT,
            Location TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE fire_violations (
            "violation date" TEXT,
            "violation item description" TEXT,
            Status TEXT,
            Address TEXT,
            "neighborhood district" TEXT,
            Location TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE sffd_service_calls (
            call_date TEXT,
            call_type TEXT,
            call_final_disposition TEXT,
            address TEXT,
            supervisor_district TEXT,
            latitude REAL,
            longitude REAL
        )
    ''')

    cursor.execute('''
        CREATE TABLE sfpd_incidents (
            unique_key TEXT PRIMARY KEY,
            category TEXT,
            descript TEXT,
            dayofweek TEXT,
            pddistrict TEXT,
            resolution TEXT,
            address TEXT,
            longitude REAL,
            latitude REAL,
            location TEXT,
            pdid TEXT,
            timestamp TEXT
        )
    ''')

    # Insert sample data
    cursor.execute('''
        INSERT INTO "311_service_requests" (unique_key, created_date, category, complaint_type, descriptor, incident_address, neighborhood, latitude, longitude, status, source)
        VALUES
        ('1234567890', '2024-01-01 10:00:00', 'Street Cleaning', 'Blocked Street', 'Street blocked', '123 Main St', 'Downtown', 37.7749, -122.4194, 'Open', 'Web'),
        ('1234567891', '2024-01-02 11:00:00', 'Graffiti', 'Graffiti Removal', 'Graffiti on wall', '456 Market St', 'SOMA', 37.7849, -122.4094, 'Open', 'Web')
    ''')

    cursor.execute('''
        INSERT INTO sfpd_incidents (unique_key, timestamp, category, descript, address, pddistrict, latitude, longitude)
        VALUES
        ('9876543210', '2024-01-01 12:00:00', 'Larceny', 'Theft from vehicle', '789 Oak St', 'Mission', 37.7649, -122.4294),
        ('9876543211', '2024-01-03 13:00:00', 'Assault', 'Battery', '321 Pine St', 'Tenderloin', 37.7849, -122.4194)
    ''')

    conn.commit()
    conn.close()

    yield db_path

    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def mock_geolocator():
    """Mock geopy geolocator for testing geocoding"""
    with patch('queries.geolocator') as mock:
        location = Mock()
        location.latitude = 37.7749
        location.longitude = -122.4194
        mock.geocode.return_value = location
        yield mock


@pytest.fixture
def mock_db_connection(test_db):
    """Mock database connection to use test database"""
    with patch('queries.get_db_connection') as mock_conn:
        def get_test_conn(db_path=None):
            conn = sqlite3.connect(test_db)
            conn.row_factory = sqlite3.Row
            return conn

        mock_conn.side_effect = get_test_conn
        yield mock_conn
