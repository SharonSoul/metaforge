#!/usr/bin/env python3
"""
Instagram Carousel Scraper
Advanced Python script to extract all images from Instagram carousel posts
"""

import json
import re
import sys
import urllib.parse
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
import time

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
        if url.endswith('/'):
            url = url[:-1]
        return url

    def extract_shared_data(self, html: str) -> Optional[Dict]:
        """Extract Instagram's shared data from HTML"""
        try:
            # Look for window._sharedData pattern
            shared_data_match = re.search(r'window\._sharedData\s*=\s*({.+?});', html, re.DOTALL)
            if shared_data_match:
                shared_data = json.loads(shared_data_match.group(1))
                return shared_data
        except Exception as e:
            print(f"Failed to parse shared data: {e}")
        return None

    def extract_script_data(self, html: str) -> List[Dict]:
        """Extract data from script tags"""
        script_data = []
        try:
            soup = BeautifulSoup(html, 'html.parser')
            scripts = soup.find_all('script', type='application/ld+json')
            
            for script in scripts:
                try:
                    data = json.loads(script.string)
                    script_data.append(data)
                except:
                    continue
        except Exception as e:
            print(f"Failed to parse script data: {e}")
        return script_data

    def extract_carousel_images_from_shared_data(self, shared_data: Dict) -> List[str]:
        """Extract carousel images from Instagram's shared data structure"""
        images = []
        try:
            entry_data = shared_data.get('entry_data', {})
            post_page = entry_data.get('PostPage', [])
            
            if post_page:
                shortcode_media = post_page[0].get('graphql', {}).get('shortcode_media', {})
                edge_sidecar = shortcode_media.get('edge_sidecar_to_children', {})
                edges = edge_sidecar.get('edges', [])
                
                for edge in edges:
                    node = edge.get('node', {})
                    display_url = node.get('display_url')
                    if display_url:
                        images.append(display_url)
                        print(f"Found image in shared data: {display_url}")
        except Exception as e:
            print(f"Failed to extract from shared data: {e}")
        return images

    def extract_images_from_patterns(self, html: str) -> List[str]:
        """Extract images using various regex patterns"""
        images = []
        
        # Pattern 1: display_url patterns
        display_url_patterns = [
            r'"display_url"\s*:\s*"([^"]+)"',
            r'"src"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"',
            r'"url"\s*:\s*"([^"]*scontent[^"]*\.jpg[^"]*)"',
        ]
        
        for pattern in display_url_patterns:
            matches = re.findall(pattern, html)
            for match in matches:
                image_url = match.replace('\\u0026', '&').replace('\\', '')
                if 'scontent' in image_url and image_url not in images:
                    images.append(image_url)
                    print(f"Found image with pattern: {image_url}")

        # Pattern 2: carousel_media structure
        carousel_patterns = [
            r'"carousel_media"\s*:\s*\[(.*?)\]',
            r'"edge_sidecar_to_children"\s*:\s*\{[^}]*"edges"\s*:\s*\[(.*?)\]',
        ]
        
        for pattern in carousel_patterns:
            matches = re.findall(pattern, html, re.DOTALL)
            for match in matches:
                # Extract display_url from carousel data
                url_matches = re.findall(r'"display_url"\s*:\s*"([^"]+)"', match)
                for url_match in url_matches:
                    image_url = url_match.replace('\\u0026', '&').replace('\\', '')
                    if 'scontent' in image_url and image_url not in images:
                        images.append(image_url)
                        print(f"Found carousel image: {image_url}")

        return images

    def extract_from_meta_tags(self, html: str) -> List[str]:
        """Extract images from meta tags"""
        images = []
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for og:image meta tags
            og_images = soup.find_all('meta', property='og:image')
            for meta in og_images:
                content = meta.get('content')
                if content and 'scontent' in content:
                    images.append(content)
                    print(f"Found og:image: {content}")
            
            # Look for additional meta tags with image content
            meta_tags = soup.find_all('meta', attrs={'content': re.compile(r'scontent.*\.jpg')})
            for meta in meta_tags:
                content = meta.get('content')
                if content and content not in images:
                    images.append(content)
                    print(f"Found meta image: {content}")
                    
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
                                    print(f"Found JSON-LD image: {img}")
                        elif isinstance(data['image'], str) and 'scontent' in data['image']:
                            images.append(data['image'])
                            print(f"Found JSON-LD image: {data['image']}")
                except:
                    continue
        except Exception as e:
            print(f"Failed to extract from JSON-LD: {e}")
        return images

    def scrape_carousel(self, url: str) -> Dict:
        """Main method to scrape Instagram carousel"""
        try:
            clean_url = self.clean_url(url)
            print(f"Scraping carousel from: {clean_url}")
            
            # Fetch the page
            response = self.session.get(clean_url, timeout=30)
            response.raise_for_status()
            
            html = response.text
            print(f"HTML length: {len(html)}")
            
            # Debug: Check if we got a valid Instagram page
            if "instagram.com" not in html.lower():
                print("Warning: Response doesn't seem to be from Instagram")
            
            # Extract title
            title_match = re.search(r'<meta property="og:title" content="([^"]+)"', html)
            title = title_match.group(1) if title_match else "Instagram Carousel"
            print(f"Extracted title: {title}")
            
            all_images = []
            
            # Method 1: Extract from shared data
            print("Method 1: Extracting from shared data...")
            shared_data = self.extract_shared_data(html)
            if shared_data:
                shared_images = self.extract_carousel_images_from_shared_data(shared_data)
                all_images.extend(shared_images)
                print(f"Found {len(shared_images)} images from shared data")
            else:
                print("No shared data found")
            
            # Method 2: Extract from patterns
            print("Method 2: Extracting from patterns...")
            pattern_images = self.extract_images_from_patterns(html)
            all_images.extend(pattern_images)
            print(f"Found {len(pattern_images)} images from patterns")
            
            # Method 3: Extract from meta tags
            print("Method 3: Extracting from meta tags...")
            meta_images = self.extract_from_meta_tags(html)
            all_images.extend(meta_images)
            print(f"Found {len(meta_images)} images from meta tags")
            
            # Method 4: Extract from JSON-LD
            print("Method 4: Extracting from JSON-LD...")
            json_ld_images = self.extract_from_json_ld(html)
            all_images.extend(json_ld_images)
            print(f"Found {len(json_ld_images)} images from JSON-LD")
            
            # Method 5: Look for any remaining image URLs in HTML
            print("Method 5: Looking for additional image URLs...")
            additional_patterns = [
                r'https://[^"\'<>\s]*scontent[^"\'<>\s]*\.jpg[^"\'<>\s]*',
                r'https://[^"\'<>\s]*scontent[^"\'<>\s]*\.jpeg[^"\'<>\s]*',
                r'https://[^"\'<>\s]*scontent[^"\'<>\s]*\.png[^"\'<>\s]*',
            ]
            
            for pattern in additional_patterns:
                matches = re.findall(pattern, html)
                for match in matches:
                    if match not in all_images:
                        all_images.append(match)
                        print(f"Found additional image: {match}")
            
            # Clean and validate URLs
            valid_images = []
            for img in all_images:
                img = img.strip()
                if img and 'scontent' in img and img not in valid_images:
                    try:
                        # Validate URL
                        urllib.parse.urlparse(img)
                        valid_images.append(img)
                    except:
                        continue
            
            # Remove duplicates and sort
            valid_images = sorted(list(set(valid_images)))
            
            print(f"Total unique valid images found: {len(valid_images)}")
            
            if valid_images:
                print("Sample images found:")
                for i, img in enumerate(valid_images[:3]):  # Show first 3
                    print(f"  {i+1}. {img}")
                
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
                print("No valid images found. Debug info:")
                print(f"- Total raw matches: {len(all_images)}")
                print(f"- HTML contains 'scontent': {'scontent' in html}")
                print(f"- HTML contains 'instagram': {'instagram' in html.lower()}")
                return {
                    "success": False,
                    "error": "No images found in the post"
                }
                
        except Exception as e:
            print(f"Scraping error: {e}")
            return {
                "success": False,
                "error": f"Failed to scrape carousel: {str(e)}"
            }

def main():
    if len(sys.argv) != 2:
        print("Usage: python instagram_carousel_scraper.py <instagram_url>")
        sys.exit(1)
    
    url = sys.argv[1]
    scraper = InstagramCarouselScraper()
    result = scraper.scrape_carousel(url)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 