"""
This file will conduct the preprocessing for the data that we currently have in the data dir
"""

import pandas as pd
import os
import re


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

    # Save to output directory
    output_path = os.path.join(output_dir, filename)
    df.to_csv(output_path, index=False)
    print(f"Saved processed file to {output_path}\n")

    return output_path


def process_directory(input_dir, output_dir, ignore_file_path='ignore.txt'):
    """
    Process all CSV files in a directory by removing ignored columns.
    """
    # Find all CSV files in the input directory
    csv_files = [f for f in os.listdir(input_dir) if f.endswith('.csv')]

    if not csv_files:
        print(f"No CSV files found in {input_dir}")
        return []

    print(f"Found {len(csv_files)} CSV files to process\n")

    processed_files = []
    for csv_file in csv_files:
        csv_path = os.path.join(input_dir, csv_file)
        output_path = process_csv_with_ignore(csv_path, output_dir, ignore_file_path)
        processed_files.append(output_path)

    print(f"Processed {len(processed_files)} files successfully!")
    return processed_files


def main():
    # Process the files
    input_dir = '../data'
    output_dir = '../processed_data'

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    process_directory(input_dir, output_dir)

    # Print the contents of the output directory
    print("\nContents of the output directory:")
    for f in os.listdir(output_dir):
        print(f"- {f}")

if __name__ == "__main__":
    main()