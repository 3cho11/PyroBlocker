import os
import json

def get_file_size(file_name):
    # Define the base path
    base_path = '/home/3cho11/Documents/PyroBlocker/dataset'
    
    # Combine the base path with the file name
    file_path = os.path.join(base_path, file_name)
    
    # Check if the file exists
    if not os.path.exists(file_path):
        print(f"File {file_path} does not exist.")
        return
    
    # Open and load the JSON file
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    # Get the number of elements in the JSON file
    num_elements = len(data)
    
    print(f"The JSON file contains {num_elements} elements.")

# Example usage
file_name = 'combined_data.json'
get_file_size(file_name)