# MediaForge - Professional Social Media Downloader

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/sharonsouls-projects/v0-meta-forge-requirements)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/s4iSoI2nVS2)

## Overview

Professional social media downloader using reliable third-party services for Instagram and TikTok content extraction.

## Features

### 🔧 TikWM API Integration
- Professional TikTok downloader service
- HD quality support (1080p when available)
- No API key required - uses public endpoints

### 📋 Multiple Extraction Methods
1. **TikWM Service** (Primary for TikTok)
2. **Meta Tag Extraction** (Fallback for both platforms)
3. **HTML Pattern Matching** (Last resort)

### ✅ File Validation
- Minimum file size validation (50KB+)
- Content type verification
- Proper error handling and user feedback

### 🎯 Enhanced Download Process
- Dedicated download API endpoint
- Platform-specific headers
- Timeout protection (60 seconds)
- File size display and warnings

## Technical Implementation

### Third-Party Services Used

**TikWM API**: `https://www.tikwm.com/api/`
- No authentication required
- Supports HD quality requests
- Returns structured JSON with video metadata
- Handles both regular and short TikTok URLs

### Extraction Flow

1. **URL Validation**: Check platform and format
2. **Primary Extraction**: Use TikWM API for TikTok, Meta tags for Instagram
3. **Fallback Methods**: Meta tag extraction → HTML pattern matching
4. **File Validation**: Verify file size and content type
5. **Download Processing**: Stream file with proper headers

### Error Handling

- Specific error messages for each failure point
- File size warnings for suspicious downloads
- Fallback instructions for manual download
- Comprehensive logging for debugging

## Deployment

Your project is live at:
**[https://vercel.com/sharonsouls-projects/v0-meta-forge-requirements](https://vercel.com/sharonsouls-projects/v0-meta-forge-requirements)**

## Build your app

Continue building your app on:
**[https://v0.dev/chat/projects/s4iSoI2nVS2](https://v0.dev/chat/projects/s4iSoI2nVS2)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
