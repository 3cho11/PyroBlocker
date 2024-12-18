# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter

import json
import os

class JsonWriterPipeline:
    def open_spider(self, spider):
        # Ensure the directory exists and open the file for writing
        if not os.path.exists('html'):
            os.makedirs('html')
        self.file = open('html/html-data.json', 'w', encoding='utf-8')
        self.file.write('[\n')  # Start the JSON array

    def close_spider(self, spider):
        self.file.write('\n]')  # End the JSON array
        self.file.close()

    def process_item(self, item, spider):
        # Write the item to the JSON file
        line = json.dumps(dict(item), ensure_ascii=False) + ',\n'
        self.file.write(line)
        return item  # Return the item for further processing

