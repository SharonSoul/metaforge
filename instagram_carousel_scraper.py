#!/usr/bin/env python3
"""
Instagram Carousel Scraper
Advanced Python script to extract all images from Instagram carousel posts
Combines Playwright for dynamic content and requests-based fallback
"""

import json
import re
import sys
import time
import urllib.parse
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, Playwright

class InstagramCarouselScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.instagram.com/',
        })

    def clean_url(self, url: str) -> str:
        """Clean and normalize Instagram URL"""
        url = url.strip()
        if '?' in url:
            url = url.split('?')[0]
        if not url.endswith('/'):
            url += '/'
        return url

    def extract_shared_data(self, html: str) -> Optional[Dict]:
        """Extract Instagram's shared data from HTML"""
        try:
            shared_data_match = re.search(r'window\._sharedData\s*=\s*({.+?});', html, re.DOTALL)
            if shared_data_match:
                return json.loads(shared_data_match.group(1))
        except Exception as e:
            print(f"Failed to parse shared data: {e}")
        return None

    def extract_carousel_images_from_shared_data(self, shared_data: Dict) -> List[str]:
        """Extract carousel images from Instagram's shared data structure"""
        images = []
        try:
            post_page = shared_data.get('entry_data', {}).get('PostPage', [])
            if post_page:
                media = post_page[0].get('graphql', {}).get('shortcode_media', {})
                if 'edge_sidecar_to_children' in media:
                    for edge in media['edge_sidecar_to_children']['edges']:
                        node = edge.get('node', {})
                        if node.get('display_url'):
                            images.append(node['display_url'])
                elif media.get('display_url'):
                    images.append(media['display_url'])
        except Exception as e:
            print(f"Failed to extract from shared data: {e}")
        return images

    def extract_images_from_patterns(self, html: str) -> List[str]:
        """Extract images using various regex patterns"""
        images = set()
        patterns = [
            r'"display_url"\s*:\s*"([^"]+)"',
            r'"src"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"',
            r'"url"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"',
            r'https://[^"\'<>\s]*scontent[^"\'<>\s]*\.jpg[^"\'<>\s]*',
            r'https://[^"\'<>\s]*scontent[^"\'<>\s]*\.jpeg[^"\'<>\s]*',
            r'https://[^"\'<>\s]*scontent[^"\'<>\s]*\.png[^"\'<>\s]*',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, html, re.DOTALL)
            for match in matches:
                url = match.replace('\\u0026', '&').replace('\\', '')
                if 'scontent' in url:
                    images.add(url)
        return sorted(list(images))

    def extract_from_meta_tags(self, html: str) -> List[str]:
        """Extract images from meta tags"""
        images = []
        try:
            soup = BeautifulSoup(html, 'html.parser')
            og_images = soup.find_all('meta', property='og:image')
            for meta in og_images:
                content = meta.get('content')
                if content and 'scontent' in content:
                    images.append(content)
            meta_tags = soup.find_all('meta', attrs={'content': re.compile(r'scontent.*\.(jpg|jpeg|png)')})
            for meta in meta_tags:
                content = meta.get('content')
                if content and content not in images:
                    images.append(content)
        except Exception as e:
            print(f"Failed to extract from meta tags: {e}")
        return images

    def extract_from_json_ld(self, html: str) -> List[str]:
        """Extract images from JSON-LD structured data"""
        images = []
        try:
            soup = BeautifulSoup(html, 'html.parser')
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    if 'image' in data:
                        if isinstance(data['image'], list):
                            for img in data['image']:
                                if isinstance(img, str) and 'scontent' in img:
                                    images.append(img)
                        elif isinstance(data['image'], str) and 'scontent' in data['image']:
                            images.append(data['image'])
                    if '@graph' in data:
                        for item in data['@graph']:
                            if item.get('@type') == 'ImageObject' and 'contentUrl' in item:
                                images.append(item['contentUrl'])
                except:
                    continue
        except Exception as e:
            print(f"Failed to extract from JSON-LD: {e}")
        return images

    def scrape_with_playwright(self, url: str) -> Optional[Dict]:
        """Scrape using Playwright for dynamic content"""
        print("--- Method 1: Attempting extraction with Playwright ---")
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                )
                page = context.new_page()
                page.goto(url, wait_until='networkidle', timeout=60000)
                time.sleep(5)  # Wait for dynamic content to load

                all_images = []
                title = "Instagram Carousel"

                # Extract JSON-LD data
                scripts = page.query_selector_all('script[type="application/ld+json"]')
                for script in scripts:
                    try:
                        data = json.loads(script.inner_html())
                        if data.get('@type') == 'ImageObject' and 'contentUrl' in data:
                            all_images.append(data['contentUrl'])
                        if data.get('@type') == 'CreativeWork':
                            title = data.get('headline', title)
                        if '@graph' in data:
                            for item in data['@graph']:
                                if item.get('@type') == 'ImageObject' and 'contentUrl' in item:
                                    all_images.append(item['contentUrl'])
                    except (json.JSONDecodeError, KeyError):
                        continue

                # Extract images from page HTML
                html = page.content()
                shared_data = self.extract_shared_data(html)
                if shared_data:
                    shared_images = self.extract_carousel_images_from_shared_data(shared_data)
                    all_images.extend(shared_images)
                pattern_images = self.extract_images_from_patterns(html)
                all_images.extend(pattern_images)
                meta_images = self.extract_from_meta_tags(html)
                all_images.extend(meta_images)
                json_ld_images = self.extract_from_json_ld(html)
                all_images.extend(json_ld_images)

                browser.close()

                # Clean and validate images
                valid_images = []
                for img in all_images:
                    img = img.strip()
                    if img and 'scontent' in img and img not in valid_images:
                        try:
                            urllib.parse.urlparse(img)
                            valid_images.append(img)
                        except:
                            continue

                valid_images = sorted(list(set(valid_images)))

                if valid_images:
                    print(f"Successfully extracted {len(valid_images)} images via Playwright.")
                    return {
                        "success": True,
                        "data": {
                            "type": "carousel" if len(valid_images) > 1 else "image",
                            "url": valid_images[0],
                            "thumbnail": valid_images[0],
                            "title": title,
                            "quality": "High Resolution",
                            "images": valid_images if len(valid_images) > 1 else None
                        }
                    }
                else:
                    print("Playwright ran but found no images.")
                    return None

        except Exception as e:
            print(f"Playwright execution failed: {e}")
            return None

    def scrape_carousel_fallback(self, url: str) -> Dict:
        """Fallback to requests-based scraping if Playwright fails"""
        print("--- Method 2: Falling back to basic requests ---")
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            html = response.text

            # Extract title
            title_match = re.search(r'<meta property="og:title" content="([^"]+)"', html)
            title = title_match.group(1) if title_match else "Instagram Carousel"

            all_images = []

            # Extract from shared data
            shared_data = self.extract_shared_data(html)
            if shared_data:
                shared_images = self.extract_carousel_images_from_shared_data(shared_data)
                all_images.extend(shared_images)

            # Extract from patterns
            pattern_images = self.extract_images_from_patterns(html)
            all_images.extend(pattern_images)

            # Extract from meta tags
            meta_images = self.extract_from_meta_tags(html)
            all_images.extend(meta_images)

            # Extract from JSON-LD
            json_ld_images = self.extract_from_json_ld(html)
            all_images.extend(json_ld_images)

            # Clean and validate images
            valid_images = []
            for img in all_images:
                img = img.strip()
                if img and 'scontent' in img and img not in valid_images:
                    try:
                        urllib.parse.urlparse(img)
                        valid_images.append(img)
                    except:
                        continue

            valid_images = sorted(list(set(valid_images)))

            if valid_images:
                print(f"Found {len(valid_images)} images via fallback method.")
                return {
                    "success": True,
                    "data": {
                        "type": "carousel" if len(valid_images) > 1 else "image",
                        "url": valid_images[0],
                        "thumbnail": valid_images[0],
                        "title": title,
                        "quality": "High Resolution",
                        "images": valid_images if len(valid_images) > 1 else None
                    }
                }
            else:
                print("No valid images found in fallback method.")
                return {
                    "success": False,
                    "error": "No images found after all methods."
                }

        except Exception as e:
            print(f"Fallback scraping error: {e}")
            return {
                "success": False,
                "error": f"Scraping failed: {str(e)}"
            }

    def scrape_carousel(self, url: str) -> Dict:
        """Main method to scrape Instagram carousel with a tiered approach"""
        clean_url = self.clean_url(url)
        print(f"Scraping from: {clean_url}")

        # Try Playwright first
        result = self.scrape_with_playwright(clean_url)
        if result and result.get("success"):
            return result

        # Fallback to requests-based scraping
        return self.scrape_carousel_fallback(clean_url)

def main():
    if len(sys.argv) != 2:
        print("Usage: python instagram_carousel_scraper.py <instagram_url>")
        sys.exit(1)

    url = sys.argv[1]
    scraper = InstagramCarouselScraper()
    result = scraper.scrape_carousel(url)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()