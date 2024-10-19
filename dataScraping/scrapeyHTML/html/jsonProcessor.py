import json

# Path to the input and output files
input_file = 'dataScraping/scrapeyHTML/html/html-data.json'
output_file = 'dataScraping/scrapeyHTML/html/combined_external2.json'

import json

def collect_external2_from_single_json(input_file, output_file):
    all_external2_links = []

    # Load the large JSON file containing multiple objects
    with open(input_file, 'r', encoding='utf-8') as file:
        data = json.load(file)
        # Loop through each object in the list and collect external2 links
        for item in data:
            links = item['links']
            if 'external2' in links:
                all_external2_links.extend(links['external2'])

    # Remove duplicate links
    all_external2_links = list(set(all_external2_links))

    # Save the collected external2 links into a new JSON file
    with open(output_file, 'w', encoding='utf-8') as outfile:
        json.dump(all_external2_links, outfile, ensure_ascii=False, indent=4)

    print(f"Collected {len(all_external2_links)} unique external2 links and saved to {output_file}")

collect_external2_from_single_json(input_file, output_file)
