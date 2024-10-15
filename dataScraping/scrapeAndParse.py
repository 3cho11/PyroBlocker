import scrapy
import csv
from bs4 import BeautifulSoup

class WebsiteSpider(scrapy.Spider):
    name = "website_spider"

    def start_requests(self):
        # Convert CSV to an array of URLs
        urls = []
        with open('./websites.csv', 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                urls.append(row[0])
        # Use Scrapy to collect data from each URL
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        # Parse the raw HTML using BeautifulSoup
        soup = BeautifulSoup(response.body, 'html.parser')

        # Extract relevant content (you can modify these sections as needed)
        page_data = {
            "url": response.url,
            "title": soup.title.string if soup.title else '',
            "meta_description": soup.find('meta', {'name': 'description'})['content'] if soup.find('meta', {'name': 'description'}) else '',
            "headings": {
                "h1": [h1.get_text() for h1 in soup.find_all('h1')],
                "h2": [h2.get_text() for h2 in soup.find_all('h2')]
            },
            "main_content": [p.get_text() for p in soup.find_all('p')],
            "links": {
                "internal": [a['href'] for a in soup.find_all('a', href=True) if response.url in a['href']],
                "external": [a['href'] for a in soup.find_all('a', href=True) if response.url not in a['href']]
            }
        }

        # Save the parsed data to a JSON file
        page = response.url.split("/")[-2]
        filename = f'html/{page}.json'
        with open(filename, 'w', encoding='utf-8') as f:
            import json
            json.dump(page_data, f, ensure_ascii=False, indent=2)

        self.log(f'Saved parsed data to {filename}')
