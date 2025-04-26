import json

def combine_json_files(file1, file2, output_file):
    with open(file1, 'r') as f1, open(file2, 'r') as f2:
        data1 = json.load(f1)
        data2 = json.load(f2)
        
        combined_data = data1 + data2
        
    with open(output_file, 'w') as out_file:
        json.dump(combined_data, out_file, indent=4)

if __name__ == "__main__":
    file1 = '/home/3cho11/Documents/PyroBlocker/dataset/nonAdult_raw_data1.json'
    file2 = '/home/3cho11/Documents/PyroBlocker/dataset/nonAdult_raw_data2.json'
    output_file = '/home/3cho11/Documents/PyroBlocker/dataset/combined_data.json'
    
    combine_json_files(file1, file2, output_file)