import csv
import os

# Define the folder path
folder_path = '/home/3cho11/Documents/PyroBlocker/dataScraping/raw_urls/'

# List of input files
input_files = ['adult1.csv', 'adult2.csv', 'adult3.csv', 'adult4.csv']

# Output file
output_file = 'adultComplete.csv'

# Set to store unique rows
unique_rows = set()

# Read and combine files
for file_name in input_files:
    file_path = os.path.join(folder_path, file_name)
    with open(file_path, mode='r', newline='') as file:
        reader = csv.reader(file)
        for row in reader:
            unique_rows.add(tuple(row))

# Write to the output file
output_path = os.path.join(folder_path, output_file)
with open(output_path, mode='w', newline='') as file:
    writer = csv.writer(file)
    for row in unique_rows:
        writer.writerow(row)

print(f"Combined CSV files into {output_file} with duplicates removed.")