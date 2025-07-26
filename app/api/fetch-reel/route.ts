import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('instagram.com/reel/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid Instagram Reel URL. Please provide a valid Instagram Reel URL.' 
      }, { status: 400 });
    }

    console.log('Processing Instagram Reel URL:', url);

    // Try yt-dlp first
    try {
      console.log('Trying yt-dlp...');
      const ytDlpOutput = await new Promise<string>((resolve, reject) => {
        const proc = spawn('yt-dlp', ['-j', url]);
        let data = '';
        let errorData = '';
        
        proc.stdout.on('data', chunk => data += chunk);
        proc.stderr.on('data', chunk => errorData += chunk);
        
        proc.on('close', code => {
          if (code === 0) {
            resolve(data);
          } else {
            reject(new Error(`yt-dlp failed with code ${code}: ${errorData}`));
          }
        });
        
        proc.on('error', err => {
          reject(new Error(`yt-dlp process error: ${err.message}`));
        });
      });

      const ytDlpJson = JSON.parse(ytDlpOutput);
      console.log('yt-dlp output parsed successfully');

      // Extract video URL from yt-dlp output
      let videoUrl = ytDlpJson.url;
      
      // If no direct URL, try to get the best format
      if (!videoUrl && ytDlpJson.formats && ytDlpJson.formats.length > 0) {
        // Sort formats by quality (prefer higher resolution)
        const sortedFormats = ytDlpJson.formats.sort((a: any, b: any) => {
          const aHeight = a.height || 0;
          const bHeight = b.height || 0;
          return bHeight - aHeight;
        });
        videoUrl = sortedFormats[0].url;
      }

      if (videoUrl) {
        console.log('Video URL found via yt-dlp:', videoUrl);
        return NextResponse.json({ 
          success: true, 
          url: videoUrl,
          title: ytDlpJson.title || 'Instagram Reel',
          thumbnail: ytDlpJson.thumbnail,
          duration: ytDlpJson.duration,
          quality: 'High Quality (via yt-dlp)'
        });
      }
    } catch (ytDlpErr) {
      console.log('yt-dlp failed:', ytDlpErr);
      // Continue to BitLoader fallback
    }

    // Fallback to BitLoader API
    console.log('Trying BitLoader API...');
    try {
      const bitloaderResponse = await fetch('https://www.bitloader.app/api/v1/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.bitloader.app',
          'Referer': 'https://www.bitloader.app/',
        },
        body: `url=${encodeURIComponent(url)}`,
      });

      if (!bitloaderResponse.ok) {
        throw new Error(`BitLoader API returned ${bitloaderResponse.status}`);
      }

      const bitloaderData = await bitloaderResponse.json();
      console.log('BitLoader API response:', bitloaderData);

      if (bitloaderData.code === 0 && bitloaderData.data?.url) {
        console.log('Video URL found via BitLoader:', bitloaderData.data.url);
        return NextResponse.json({ 
          success: true, 
          url: bitloaderData.data.url,
          title: bitloaderData.data.title || 'Instagram Reel',
          thumbnail: bitloaderData.data.thumbnail,
          duration: bitloaderData.data.duration,
          quality: 'High Quality (via BitLoader)'
        });
      }
    } catch (bitloaderErr) {
      console.log('BitLoader API failed:', bitloaderErr);
    }

    // If both methods failed
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to extract video URL from Instagram Reel. The reel might be private, deleted, or region-restricted.' 
    }, { status: 404 });

  } catch (error) {
    console.error('Unexpected error in fetch-reel:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred while processing the Instagram Reel.' 
    }, { status: 500 });
  }
} 