import json
import random
import csv
import os

# Set the current working directory to the directory of this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def sample_urls(file_path, sample_size):
    # Open the JSON file with UTF-8 encoding
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    # Extract the URLs from the dataset
    urls = [entry['url'] for entry in data if 'url' in entry]

    # Ensure we sample up to the minimum of the sample_size or the available URLs
    return random.sample(urls, min(sample_size, len(urls)))

def write_to_csv(file_path, urls):
    # Output CSV file name (based on the input dataset file name)
    output_file = file_path.replace('.json', '_sampled.csv')

    # Open the CSV file and write the URLs
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['url'])  # Write header
        for url in urls:
            writer.writerow([url])  # Write each URL as a row

    print(f"Sampled URLs saved to: {output_file}")

def main():
    files = [
        '../../dataset/raw_adult_data.json',
        '../../dataset/raw_safe_data.json',
        '../../dataset/miniData/inbetweenSafe.json'
    ]
    sample_size = 50
    sampled_urls = {}

    for file_path in files:
        try:
            sampled_urls[file_path] = sample_urls(file_path, sample_size)
            # Write the sampled URLs to CSV
            write_to_csv(file_path, sampled_urls[file_path])
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    main()