input_file = '/home/3cho11/Documents/PyroBlocker/dataScraping/raw_urls/url-data.csv'
output_file = '/home/3cho11/Documents/PyroBlocker/dataScraping/raw_urls/nonAdult1.csv'


with open(input_file, 'r') as infile:
    lines = infile.readlines()

with open(output_file, 'w') as outfile:
    for line in lines[-50000:]:
        outfile.write(line)