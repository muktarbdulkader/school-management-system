/**
 * API Debug Utility
 * Add this to your component to see which API calls are failing
 */

// Intercept fetch to log all API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [url, options] = args;
  console.log('🌐 API Call:', {
    url,
    method: options?.method || 'GET',
    headers: options?.headers,
    body: options?.body ? JSON.parse(options.body) : null
  });

  try {
    const response = await originalFetch(...args);
    const clonedResponse = response.clone();
    
    // Try to read as text first
    const text = await clonedResponse.text();
    
    console.log('📥 API Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      preview: text.substring(0, 200)
    });

    // If it's HTML when we expect JSON, log error
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.error('❌ Received HTML instead of JSON!', {
        url,
        status: response.status,
        html: text.substring(0, 500)
      });
    }

    return response;
  } catch (error) {
    console.error('❌ API Error:', {
      url,
      error: error.message
    });
    throw error;
  }
};

export default {};
