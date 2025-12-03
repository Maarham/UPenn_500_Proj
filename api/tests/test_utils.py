import pytest
import sqlite3
from unittest.mock import Mock, patch
from geopy.exc import GeocoderServiceError
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from queries import parse_float, geocode_address, get_db_connection


class TestGeocodeAddress:
    """Test cases for geocode_address function"""

    def test_geocode_address_empty(self):
        """Test geocoding with empty address"""
        lat, lon = geocode_address("")
        assert lat is None
        assert lon is None

    def test_geocode_address_none(self):
        """Test geocoding with None address"""
        lat, lon = geocode_address(None)
        assert lat is None
        assert lon is None

    @patch('queries.geolocator')
    def test_geocode_address_success(self, mock_geolocator):
        """Test successful geocoding"""
        # Mock successful geocoding
        mock_location = Mock()
        mock_location.latitude = 37.7749
        mock_location.longitude = -122.4194
        mock_geolocator.geocode.return_value = mock_location

        lat, lon = geocode_address("123 Main St")

        assert lat == 37.7749
        assert lon == -122.4194
        mock_geolocator.geocode.assert_called_once()

    @patch('queries.geolocator')
    def test_geocode_address_with_zipcode(self, mock_geolocator):
        """Test geocoding with zip code"""
        mock_location = Mock()
        mock_location.latitude = 37.7749
        mock_location.longitude = -122.4194
        mock_geolocator.geocode.return_value = mock_location

        lat, lon = geocode_address("123 Main St", "94102")

        assert lat == 37.7749
        assert lon == -122.4194
        # Verify zip code was included in query
        call_args = mock_geolocator.geocode.call_args[0][0]
        assert "94102" in call_args

    @patch('queries.geolocator')
    def test_geocode_address_not_found(self, mock_geolocator):
        """Test geocoding when location not found"""
        mock_geolocator.geocode.return_value = None

        lat, lon = geocode_address("Nonexistent Address")

        assert lat is None
        assert lon is None

    @patch('queries.geolocator')
    def test_geocode_address_service_error(self, mock_geolocator):
        """Test geocoding with service error"""
        mock_geolocator.geocode.side_effect = GeocoderServiceError("Service unavailable")

        lat, lon = geocode_address("123 Main St")

        assert lat is None
        assert lon is None

    @patch('queries.geolocator')
    def test_geocode_address_timeout(self, mock_geolocator):
        """Test geocoding handles timeout parameter"""
        mock_location = Mock()
        mock_location.latitude = 37.7749
        mock_location.longitude = -122.4194
        mock_geolocator.geocode.return_value = mock_location

        geocode_address("123 Main St")

        # Verify timeout was passed
        call_kwargs = mock_geolocator.geocode.call_args[1]
        assert call_kwargs['timeout'] == 5
