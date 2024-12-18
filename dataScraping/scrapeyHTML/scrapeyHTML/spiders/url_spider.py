# scraper.py
import scrapy
import csv
from scrapy.utils.project import get_project_settings
from ..items import PageItem

class mainSpider(scrapy.Spider):
    name = "url_spider"

    def start_requests(self):
        # Convert CSV to an array of URLs
        with open('./data/getUrls.csv', 'r') as file:
            reader = csv.reader(file)
            urls = [row[0] for row in reader if row]  # Ensure row is not empty
        # Use Scrapy to collect data from each URL
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        # Create an instance of PageItem
        page_item = PageItem()
        
        # Populate the item with extracted data
        page_item['url'] = response.url
        page_item['title'] = response.xpath('//title/text()').get(default='').strip()
        page_item['links'] = {
            "internal": response.xpath('//a[starts-with(@href, "")]/@href').getall(),
            "external": response.xpath('//a[not(starts-with(@href, ""))]/@href').getall(),
            "external2": response.xpath('//div[@class="url_link_container"]/@data-external-link').getall()
        }

        # Yield the item to the pipeline
        yield page_item
