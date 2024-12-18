# scraper.py
import scrapy
import csv
import sys
from scrapy.utils.project import get_project_settings
from ..items import PageItem
from urllib.parse import urlparse, urlunparse
import re

# Increase CSV field size limit
csv.field_size_limit(sys.maxsize)

class mainSpider(scrapy.Spider):
    name = "main_spider"

    def start_requests(self):
        # Convert CSV to an array of URLs
        with open('./data/getUrls.csv', 'r') as file:
            reader = csv.reader(file)
            urls = [row[0] for row in reader if row]  # Ensure row is not empty
        # Use Scrapy to collect data from each URL
        for url in urls:
            # Add scheme if missing
            url = self.add_default_scheme(url)
            yield scrapy.Request(url=url, callback=self.parse)

    def add_default_scheme(self, url):
        """Add 'https://' if the URL is missing the scheme."""
        parsed_url = urlparse(url)
        if not parsed_url.scheme:
            return 'https://' + url  # Default to 'https://' if scheme is missing
        return url

    def clean_url(self, url, domain):
        """Remove query parameter and occurences of uninformative substrings from the URL."""
        # remove all text after a '?' character in the url
        url = url.split('?')[0]
        # choose substrings based on if the url is external or internal
        if (domain is None): # external
            substringList = ['https://', 'http://', 'www.', '.com/', '.com', '.org/', '.org', '.net/', '.net', '.php', '.html']
        else: # internal
            substringList = ['.php', '.html', domain]
        # remove specific substrings from url
        for substring in substringList:
            url = url.replace(substring, '')
        # removing '/' from start & end of url
        if url.startswith('/'):
            url = url[1:]
        if url.endswith('/'):
            url = url[:-1]
        return url

    def parse(self, response):
        # Create an instance of PageItem
        page_item = PageItem()
        
        # Extract the domain to clean internal URLs later
        domain = urlparse(response.url).netloc

        # Populate the item with extracted data
        page_item['url'] = self.clean_url(response.url, None)
        page_item['title'] = response.xpath('//title/text()').get(default='').strip()
        page_item['meta_description'] = response.xpath('//meta[@name="description"]/@content').get(default='').strip()

        ## process text elements
        def filter_out_symbols(text_list):
            """Filter out strings that do not contain alphabetical characters or digits."""
            return [text for text in text_list if any(char.isalpha() for char in text) or any(char.isdigit() for char in text)]
        # collect <h1> and <h2> inner text
        page_item['headings'] = {
            "h1": [re.sub(r'\s+', ' ', text.replace('\n', '').strip()) for text in set(filter_out_symbols(response.xpath('//h1/text()').getall()))],
            "h2": [re.sub(r'\s+', ' ', text.replace('\n', '').strip()) for text in set(filter_out_symbols(response.xpath('//h2/text()').getall()))]
        }
        # collect <p> inner text
        page_item['main_content'] = [re.sub(r'\s+', ' ', text.replace('\n', '').strip()) for text in set(filter_out_symbols(response.xpath('//p/text()').getall()))]

        ## process links
        # get internal and external links
        # Internal links: hrefs that are non-empty and are relative (start with /)
        internal_links = response.xpath('//a[starts-with(@href, "/") and string-length(@href) > 1]/@href').getall()
        # External links: hrefs that are non-empty and start with http:// or https://
        external_links = response.xpath('//a[starts-with(@href, "http") and string-length(@href) > 1]/@href').getall()
        # clean internal and external links
        internal_links = list(set([self.clean_url(url, domain) for url in internal_links]))
        # remove duplicates and 'https://' from external links
        external_links = list(set([self.clean_url(url, None) for url in external_links]))
        # add cleaned links to page_item
        page_item['links'] = {
            "internal": internal_links,
            "external": external_links
        }

        # Yield the item to the pipeline
        yield page_item
