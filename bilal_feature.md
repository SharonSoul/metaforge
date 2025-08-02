## Good Day Bro! It's Bilal here


# Instagram Carousel Scraper
Objective:
A Python script to reliably extract images from Instagram carousel posts, designed to handle dynamic content and varying Instagram HTML/JSON structures.

## Improvement Overview

This script scrapes images from Instagram carousel posts (multi-image posts) using many approach combining Playwright for dynamic content and a requests-based fallback for static HTML parsing. It addresses issues with inconsistent image extraction, such as missing images, low-resolution versions, or failures due to Instagram's dynamic JavaScript loading.

## Improvements Made

The original implementation relied on regex patterns, `window._sharedData` parsing, and HTML scraping, which you said was "hit-or-miss", often extracting only one image, low-res versions, or failing entirely due to Instagram's dynamic content loading. The updated version includes the following enhancements:

1. **Playwright Integration**: 
   - Uses Playwright to render JavaScript-heavy pages, ensuring dynamic content (e.g., carousel images) is fully loaded before extraction.
   - Waits for `networkidle` and adds a 5-second delay to capture lazy-loaded images.
   - Extracts images from JSON-LD, shared data, regex patterns, and meta tags within the rendered page.

2. **Robust Fallback Mechanism**:
   - Falls back to a requests-based approach if Playwright fails, using multiple extraction methods (shared data, regex patterns, meta tags, JSON-LD) to maximize success.
   - Combines all extraction methods from the original implementation to ensure compatibility with static HTML.

3. **Comprehensive Extraction**:
   - Employs multiple techniques: JSON-LD parsing (including `@graph` structures), `window._sharedData`, regex patterns for `display_url` and `scontent` URLs, and meta tags (`og:image`).
   - Supports `.jpg`, `.jpeg`, and `.png` formats to capture all possible image types.
   - Deduplicates and validates URLs to ensure only valid, high-resolution images are returned.

4. **Error Handling and Reliability**:
   - Wraps all extraction methods in try-except blocks to prevent crashes and log specific errors.
   - Validates URLs using `urllib.parse.urlparse` to filter out invalid or non-image URLs.
   - Handles Instagram's dynamic structure changes by combining multiple extraction paths.

5. **Lightweight Alternative to Selenium**:
   - Replaces Selenium with Playwright, which is faster, more reliable for headless browsing, and easier to maintain.
   - Avoids GraphQL endpoints to minimize dependency on Instagram's internal APIs, which are prone to rate-limiting and authentication issues.

## To test it install this packages and run this command in metaforge directory
This link I put is an instagram carousel link 
```bash
pip install requests beautifulsoup4 playwright
playwright install
python3 instagram_carousel_scraper.py https://www.instagram.com/p/C_LxQ-3S3Lf/
