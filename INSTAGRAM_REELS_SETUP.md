# Instagram Reels Download Setup

## Overview

This implementation provides a dedicated API endpoint for downloading Instagram Reels using yt-dlp as the primary method and BitLoader API as a fallback.

## How It Works

### 1. API Endpoint: `/api/fetch-reel`

- **Method**: POST
- **Input**: `{ url: "https://www.instagram.com/reel/..." }`
- **Output**: `{ success: true, url: "...", title: "...", quality: "..." }`

### 2. Processing Flow

1. **URL Validation**: Checks if the URL contains `/reel/`
2. **yt-dlp Primary**: Uses `yt-dlp -j <url>` to extract video information
3. **BitLoader Fallback**: If yt-dlp fails, tries BitLoader API
4. **Response**: Returns the best quality video URL found

### 3. Frontend Integration

- When user selects "Instagram" + "Videos" + enters a Reel URL
- Frontend automatically calls `/api/fetch-reel` instead of generic extract
- Displays download link with video metadata

## Requirements

### System Dependencies

```bash
# Install yt-dlp (required for primary extraction)
pip install yt-dlp

# Verify installation
yt-dlp --version
```

### Environment Variables

No additional environment variables required for basic functionality.

## Usage

### 1. Frontend Usage

1. Go to the Media Downloader section
2. Select "Instagram" platform
3. Select "Videos" media type
4. Paste an Instagram Reel URL (e.g., `https://www.instagram.com/reel/ABC123/`)
5. Click "Extract Media"
6. The system will try yt-dlp first, then BitLoader if needed

### 2. API Usage

```javascript
const response = await fetch('/api/fetch-reel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: 'https://www.instagram.com/reel/ABC123/' 
  })
});

const data = await response.json();
if (data.success) {
  console.log('Video URL:', data.url);
  console.log('Title:', data.title);
  console.log('Quality:', data.quality);
}
```

## Error Handling

### Common Error Scenarios

1. **Invalid URL**: URL doesn't contain `/reel/`
2. **yt-dlp Failure**: Instagram blocks or changes structure
3. **BitLoader Failure**: API service unavailable
4. **Private Content**: Reel is private or deleted

### Error Responses

```json
{
  "success": false,
  "error": "Failed to extract video URL from Instagram Reel. The reel might be private, deleted, or region-restricted."
}
```

## Testing

### Manual Test

1. Start the development server: `npm run dev`
2. Open the Media Downloader
3. Test with a public Instagram Reel URL

### API Test

```bash
# Test the API directly
node test-reel-api.js
```

## Troubleshooting

### yt-dlp Issues

- **Not Found**: Install yt-dlp globally or in project environment
- **Permission Error**: Check yt-dlp installation and permissions
- **Network Error**: Check internet connection and Instagram accessibility

### BitLoader Issues

- **API Down**: BitLoader service temporarily unavailable
- **Rate Limited**: Too many requests to BitLoader API
- **Invalid Response**: BitLoader API format changed

### General Issues

- **CORS**: Ensure API is called from same origin
- **Timeout**: Long extraction times for large videos
- **Memory**: Large video processing may require more memory

## Performance Notes

- **yt-dlp**: Generally faster and more reliable
- **BitLoader**: Good fallback, may be slower
- **Caching**: Consider implementing result caching for repeated requests
- **Rate Limiting**: Implement rate limiting for production use

## Security Considerations

- **Input Validation**: URLs are validated before processing
- **Error Messages**: Generic error messages to avoid information leakage
- **Logging**: Sensitive data is not logged
- **CORS**: API should be called from authorized domains only

## Future Enhancements

1. **Multiple Fallbacks**: Add more extraction services
2. **Quality Selection**: Allow users to choose video quality
3. **Batch Processing**: Support multiple URLs at once
4. **Progress Tracking**: Real-time extraction progress
5. **Caching**: Cache successful extractions
6. **Analytics**: Track success rates of different services 