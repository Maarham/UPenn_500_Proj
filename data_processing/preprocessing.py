"""
This file will conduct the preprocessing for the data that we currently have in the data dir
"""

import pandas as pd
import os
import re
import sqlite3
import csv


def load_ignore_columns(ignore_file_path='ignore.txt'):
    """
    Load the ignore.txt file and parse column names to ignore for each dataset.
    """
    ignore_dict = {}

    with open(ignore_file_path, 'r') as f:
        lines = f.readlines()

    current_dataset = None
    current_ignore_list = []

    for line in lines:
        line = line.strip()

        # Skip empty lines
        if not line:
            if current_dataset and current_ignore_list:
                ignore_dict[current_dataset] = current_ignore_list
                current_dataset = None
                current_ignore_list = []
            continue

        # Check if this is a dataset name line (ends with .csv:)
        if line.endswith('.csv:'):
            # Save previous dataset if exists
            if current_dataset and current_ignore_list:
                ignore_dict[current_dataset] = current_ignore_list

            current_dataset = line[:-1]  # Remove the colon
            current_ignore_list = []

        # Check if this is an ignore line
        elif line.startswith('Ignore:'):
            # Extract column names after "Ignore:"
            columns_str = line[7:].strip()  # Remove "Ignore:" prefix

            # Split by comma and clean up column names
            columns = [col.strip().strip("'\"") for col in columns_str.split(',')]
            columns = [col for col in columns if col]  # Remove empty strings
            current_ignore_list.extend(columns)

        # Handle continuation lines (for multi-line ignore lists)
        elif current_dataset and current_ignore_list:
            # Remove leading/trailing whitespace and quotes
            columns_str = line.strip("'\"")
            columns = [col.strip().strip("'\"") for col in columns_str.split(',')]
            columns = [col for col in columns if col]  # Remove empty strings
            current_ignore_list.extend(columns)

    # Don't forget the last dataset
    if current_dataset and current_ignore_list:
        ignore_dict[current_dataset] = current_ignore_list

    return ignore_dict


def process_csv_with_ignore(csv_path, output_dir, ignore_file_path='ignore.txt'):
    """
    Process a CSV file by removing ignored columns and saving to output directory.
    """
    # Get the filename from the path
    filename = os.path.basename(csv_path)

    # Load ignore columns
    ignore_dict = load_ignore_columns(ignore_file_path)


    # Get columns to ignore for this dataset
    columns_to_ignore = ignore_dict.get(filename, [])

    if len(columns_to_ignore) == 0:
        if str(filename).lower() == 'fire-inspections.csv':
            columns_to_ignore = ['Referral Agency', 'Complaint Number', 'Violation Number', 'Battalion', 'Station Area', 'Supervisor District', 'Neighborhoods (old)', 'Zip Codes', 
            'Fire Prevention Districts', 'Police Districts', 'Supervisor Districts', 
            'Central Market/Tenderloin Boundary', 'Central Market/Tenderloin Boundary Polygon - Updated', 'Neighborhoods', 'SF Find Neighborhoods', 'Current Police Districts', 
            'Current Supervisor Districts', 'Analysis Neighborhoods', 'Lien Date', 'Interest Amount', 'Point']
        if str(filename).lower() == 'fire-incidents.csv':
            columns_to_ignore = ['2017 Fix It Zones', 'HSOC Zones as of 2018-06-05', 'HSOC Zones',
            'Central Market/Tenderloin Boundary Polygon - Updated',
            'Central Market/Tenderloin Boundary',
            'Civic Center Harm Reduction Project Boundary',
            'Number of floors with minimum damage',
            'Number of floors with significant damage',
            'Number of floors with heavy damage',
            'Number of floors with extreme damage']
        if str(filename).lower() == 'fire-safety-complaints.csv':
            columns_to_ignore = [ "Primary",
            "Complaint Number",
            "Complaint Item Type",
            "Battalion",
            "Station Area",
            "Fire Prevention District",
            "Entry Date",
            "Supervisor District",
            "Neighborhoods (Old)",
            "Police Districts",
            "Neighborhood_from_fyvs_ahh9",
            "Neighborhoods_from_fyvs_ahh9",
            "Supervisor Districts", "Fire Prevention Districts", "Current Police Districts",
            "Neighborhoods - Analysis Boundaries", "Zip Codes"]
        if str(filename).lower() == 'fire-violations.csv':
            columns_to_ignore = [
                "Battalion",
                "Station Area",
                "Neighborhoods_from_fyvs_ahh9 2",
    "Supervisor Districts 2",
    "Fire Prevention Districts 2",
    "Current Police Districts 2",
    "Neighborhoods - Analysis Boundaries 2",
    "Zip Codes 2",
    "Police Districts 2",
                "Fire Prevention District",
                "Citation Number",
                "Primary",
                "Neighborhood_from_fyvs_ahhh9 2",
                "Neighborhoods (Old) 2",
                "Police District 2",
                "Central Market/Tenderloin Boundary 2",
                "Central Market/Tenderloin Boundary Polygon - Updated 2",
                "Neighborhoods",
                "SF Find Neighborhoods",
                "Current Police Districts 3",
                "Current Supervisor Districts",
                'supervisor district'
            ]
    # Read the CSV
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Original shape: {df.shape}")

    if not columns_to_ignore:
        print(f"No columns to ignore for {filename}")
    else:
        # Find which columns actually exist in the dataframe
        # (case-insensitive matching)
        df_columns_lower = {col.lower(): col for col in df.columns}
        columns_to_drop = []

        for ignore_col in columns_to_ignore:
            ignore_col_lower = ignore_col.lower()
            if ignore_col_lower in df_columns_lower:
                columns_to_drop.append(df_columns_lower[ignore_col_lower])
            else:
                print(f"Warning: Column '{ignore_col}' not found in {filename}")

        # Drop the columns
        if columns_to_drop:
            print(f"Dropping {len(columns_to_drop)} columns: {columns_to_drop}")
            df = df.drop(columns=columns_to_drop)
            print(f"New shape after dropping ignored columns: {df.shape}")

    # Remove columns that are 95% or more empty
    threshold = 0.95
    empty_threshold = len(df) * threshold
    columns_before = df.columns.tolist()

    # Calculate the number of missing values per column
    missing_counts = df.isnull().sum()
    columns_to_drop_empty = [col for col, count in missing_counts.items() if count >= empty_threshold]

    if columns_to_drop_empty:
        print(f"Dropping {len(columns_to_drop_empty)} columns that are 95%+ empty: {columns_to_drop_empty}")
        df = df.drop(columns=columns_to_drop_empty)
        print(f"New shape after dropping empty columns: {df.shape}")

    # Remove completely empty rows
    rows_before = len(df)
    df = df.dropna(how='all')
    rows_after = len(df)

    if rows_before != rows_after:
        print(f"Dropped {rows_before - rows_after} completely empty rows")
        print(f"New shape after dropping empty rows: {df.shape}")

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)


    ## extra data preprocessing
    if str(filename).lower() == 'fire-incidents.csv':
        df['Incident Date'] = pd.to_datetime(df['Incident Date'], errors='coerce')

    # Save to output directory
    output_path = os.path.join(output_dir, filename)
    df.to_csv(output_path, index=False)
    print(f"Saved processed file to {output_path}\n")

    return output_path


def csv_to_sqlite_table(csv_path, conn):
    """
    Convert a CSV file to a table in an existing SQLite database.

    Args:
        csv_path: Path to the CSV file
        conn: SQLite database connection

    Returns:
        Name of the created table
    """
    # Get the filename without extension to use as table name
    filename = os.path.basename(csv_path)
    table_name = os.path.splitext(filename)[0]

    # Sanitize table name (replace hyphens and spaces with underscores)
    table_name = table_name.replace('-', '_').replace(' ', '_')

    print(f"Adding {filename} as table '{table_name}'...")

    cursor = conn.cursor()

    # Drop table if it exists
    cursor.execute(f'DROP TABLE IF EXISTS "{table_name}"')

    # Read CSV and create table
    with open(csv_path, 'r') as file:
        csv_reader = csv.reader(file)
        headers = next(csv_reader)  # Get column names

        # Create table with columns from CSV headers
        columns = ', '.join([f'"{col}" TEXT' for col in headers])
        cursor.execute(f'CREATE TABLE "{table_name}" ({columns})')

        # Insert data
        placeholders = ', '.join(['?' for _ in headers])
        for row in csv_reader:
            cursor.execute(f'INSERT INTO "{table_name}" VALUES ({placeholders})', row)

    conn.commit()
    print(f"Table '{table_name}' created successfully\n")

    return table_name


def process_directory(input_dir, output_dir, ignore_file_path='ignore.txt', create_sql_databases=False, sql_db_dir='sql_databases'):
    """
    Process all CSV files in a directory by removing ignored columns.

    Args:
        input_dir: Directory containing CSV files to process
        output_dir: Directory where processed CSVs will be saved
        ignore_file_path: Path to the ignore.txt file
        create_sql_databases: If True, also convert processed CSVs to SQLite databases
        sql_db_dir: Directory where SQLite databases will be saved

    Returns:
        Dictionary with 'csv_files' and optionally 'db_files' lists
    """
    # Find all CSV files in the input directory
    csv_files = [f for f in os.listdir(input_dir) if f.endswith('.csv')]

    if not csv_files:
        print(f"No CSV files found in {input_dir}")
        return {'csv_files': [], 'db_files': []}

    print(f"Found {len(csv_files)} CSV files to process\n")

    processed_files = []
    for csv_file in csv_files:
        csv_path = os.path.join(input_dir, csv_file)
        output_path = process_csv_with_ignore(csv_path, output_dir, ignore_file_path)
        processed_files.append(output_path)

    print(f"Processed {len(processed_files)} files successfully!")

    result = {'csv_files': processed_files, 'db_file': None, 'tables': []}

    # Convert to SQLite database if requested
    if create_sql_databases:
        print(f"\nCreating SQLite database with all processed CSVs as tables...")

        # Create database directory if it doesn't exist
        os.makedirs(sql_db_dir, exist_ok=True)

        # Create single database file
        db_path = os.path.join(sql_db_dir, 'processed_data.db')

        # Remove existing database if it exists
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"Removed existing database at {db_path}")

        # Connect to database
        conn = sqlite3.connect(db_path)

        # Add each CSV as a table
        tables = []
        for csv_path in processed_files:
            table_name = csv_to_sqlite_table(csv_path, conn)
            tables.append(table_name)

        conn.close()

        result['db_file'] = db_path
        result['tables'] = tables
        print(f"Created database at {db_path} with {len(tables)} tables: {tables}")

    return result


def main():
    # Process the files
    input_dir = '../data'
    output_dir = '../processed_data'
    sql_db_dir = '../sql_databases'

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Process directory and create SQL databases
    result = process_directory(input_dir, output_dir, create_sql_databases=True, sql_db_dir=sql_db_dir)

    # Print the contents of the output directory
    print("\nContents of the processed_data directory:")
    for f in os.listdir(output_dir):
        print(f"- {f}")

    # Print information about the SQL database
    if result['db_file']:
        print(f"\nSQLite database created: {result['db_file']}")
        print(f"Tables in database: {', '.join(result['tables'])}")

if __name__ == "__main__":
    main()