import pandas as pd
import sqlite3

# Read the CSV files
soln_results_df = pd.read_csv("soln_results.csv")
solutions_df = pd.read_csv("solutions.csv")

# Ensure column names are correctly formatted (strip whitespace and check cases)
soln_results_df.columns = soln_results_df.columns.str.strip()
solutions_df.columns = solutions_df.columns.str.strip()

# Check column names after formatting
print("Columns in soln_results_df:", soln_results_df.columns)
print("Columns in solutions_df:", solutions_df.columns)

# Merge the DataFrames
merged_df = pd.merge(soln_results_df, solutions_df, on="Solution", how="inner")

# Check the merged DataFrame
print("Columns in merged_df:", merged_df.columns)
print(merged_df.head())

# If 'CO2eq' and 'Sector' are present in merged_df, select them
if 'CO2eq' in merged_df.columns and 'Sector' in merged_df.columns:
    final_df = merged_df[["Solution", "CO2eq", "Sector"]]
    
else:
    print("Error: CO2eq and/or Sector columns are not present in the merged DataFrame.")


# Function to create a SQLite database and insert data
def create_and_populate_db(dataframe, db_name="solutions_db.sqlite"):
    # Connect to SQLite database
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()

    # Create table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS solutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            solution TEXT NOT NULL,
            sector TEXT,
            CO2eq REAL
        )
    ''')

    # Insert data into the table
    for _, row in dataframe.iterrows():
        cursor.execute('''
            INSERT INTO solutions (solution, sector, CO2eq)
            VALUES (?, ?, ?)
        ''', (row['Solution'], row['Sector'], row['CO2eq']))

    # Commit changes and close the connection
    conn.commit()
    conn.close()

# Create and populate the database
create_and_populate_db(final_df)