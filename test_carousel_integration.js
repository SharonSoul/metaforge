// Test script for Instagram Carousel extraction with Python integration
const testCarouselUrl = "https://www.instagram.com/p/C8X9Y2Z1ABC/"; // Replace with a real carousel URL

async function testCarouselExtraction() {
  try {
    console.log('Testing Enhanced Instagram Carousel Extraction with Python...');
    console.log('URL:', testCarouselUrl);
    
    const response = await fetch('http://localhost:3000/api/simple-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: testCarouselUrl,
        platform: "instagram",
        mediaType: "carousels"
      }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Carousel extraction successful!');
      console.log('Title:', data.data.title);
      console.log('Type:', data.data.type);
      console.log('Image count:', data.data.images ? data.data.images.length : 1);
      if (data.data.images && data.data.images.length > 1) {
        console.log('🎉 Multiple images found in carousel!');
        data.data.images.forEach((url, index) => {
          console.log(`  ${index + 1}. ${url}`);
        });
      } else {
        console.log('⚠️ Only one image found - might not be a carousel');
      }
    } else {
      console.log('❌ Carousel extraction failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testCarouselExtraction(); 