import sqlite3
import csv

def main():
    # Connect to database (creates file if it doesn't exist)
    conn = sqlite3.connect('311_service_requests.db')
    cursor = conn.cursor()

    # Read CSV and create table
    with open('311_service_request.csv', 'r') as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)  # Get column names
        
        # Create table with columns from CSV headers
        columns = ', '.join([f'"{col}" TEXT' for col in headers])
        cursor.execute(f'CREATE TABLE IF NOT EXISTS main_table ({columns})')
        
        # Insert data
        placeholders = ', '.join(['?' for _ in headers])
        for row in csv_reader:
            cursor.execute(f'INSERT INTO main_table VALUES ({placeholders})', row)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()