# scraper.py
import scrapy
import csv
from scrapy.utils.project import get_project_settings
from ..items import PageItem
from urllib.parse import urlparse, urlunparse

class mainSpider(scrapy.Spider):
    name = "main_spider"

    def start_requests(self):
        # Convert CSV to an array of URLs
        with open('./data/getUrls.csv', 'r') as file:
            reader = csv.reader(file)
            urls = [row[0] for row in reader if row]  # Ensure row is not empty
        # Use Scrapy to collect data from each URL
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)


    def remove_scheme(self, url):
        """Remove occurrences of https://, http://, and www."""
        parsed_url = urlparse(url)
        netloc = parsed_url.netloc.replace('www.', '')
        return urlunparse(parsed_url._replace(scheme='', netloc=netloc)).replace('//', '')


    def clean_url(self, url, domain):
        """Clean URL by removing domain, query params, and fragments."""
        parsed_url = urlparse(url)

        # Remove query parameters and fragments
        path = parsed_url.path

        # Remove the domain if present
        if domain in parsed_url.netloc:
            path = path.replace(domain, '')

        # Remove "index.html" or "index.php"
        path = path.replace('/index.html', '').replace('/index.php', '')

        # Remove trailing slashes (optional)
        if path.endswith('/'):
            path = path.rstrip('/')

        return path

    def parse(self, response):
        # Create an instance of PageItem
        page_item = PageItem()
        
        # Extract the domain to clean internal URLs later
        domain = urlparse(response.url).netloc

        # Populate the item with extracted data
        page_item['url'] = self.remove_scheme(response.url)
        page_item['title'] = response.xpath('//title/text()').get(default='').strip()
        page_item['meta_description'] = response.xpath('//meta[@name="description"]/@content').get(default='').strip()
        page_item['headings'] = {
            "h1": response.xpath('//h1/text()').getall(),
            "h2": response.xpath('//h2/text()').getall()
        }
        page_item['main_content'] = response.xpath('//p/text()').getall()

        # get internal and external links
        # Internal links: hrefs that are non-empty and are relative (start with /)
        internal_links = response.xpath('//a[starts-with(@href, "/") and string-length(@href) > 1]/@href').getall()
        # External links: hrefs that are non-empty and start with http:// or https://
        external_links = response.xpath('//a[starts-with(@href, "http") and string-length(@href) > 1]/@href').getall()

        # clean internal and external links
        # internal_links = list(set([self.clean_url(url, domain) for url in internal_links]))
        # remove duplicates and 'https://' from external links
        external_links = list(set([self.remove_scheme(url) for url in external_links]))
        # add cleaned links to page_item
        page_item['links'] = {
            "internal": internal_links,
            "external": external_links
        }

        # Yield the item to the pipeline
        yield page_item
