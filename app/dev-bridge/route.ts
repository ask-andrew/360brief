import { NextRequest, NextResponse } from 'next/server'

// This endpoint handles OAuth redirects in development by bridging from production to localhost
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const allParams = Object.fromEntries(searchParams.entries())
  
  console.log('🌉 Dev bridge received params:', allParams)
  
  // Check if this is a development environment by looking for certain indicators
  // In production, this endpoint shouldn't redirect to localhost
  const isDevelopmentRequest = process.env.NODE_ENV === 'development' || 
                              request.headers.get('referer')?.includes('localhost') ||
                              searchParams.get('dev') === 'true'
  
  if (isDevelopmentRequest) {
    // Construct localhost redirect URL
    const localhostUrl = new URL('http://localhost:3000')
    
    // Determine the target path
    if (allParams.code) {
      localhostUrl.pathname = '/auth/callback'
    } else if (allParams.connected === 'gmail') {
      localhostUrl.pathname = '/dashboard'
    } else {
      localhostUrl.pathname = '/'
    }
    
    // Add all parameters to the localhost URL
    Object.entries(allParams).forEach(([key, value]) => {
      localhostUrl.searchParams.set(key, value)
    })
    
    console.log('🔄 Redirecting to localhost:', localhostUrl.toString())
    
    // Return HTML that redirects via JavaScript for better compatibility
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Development OAuth Bridge</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f8f9fa;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #007bff;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>Redirecting to Development Environment</h2>
            <p>Processing OAuth callback...</p>
          </div>
          <script>
            console.log('🔄 Redirecting to: ${localhostUrl.toString()}');
            window.location.href = '${localhostUrl.toString()}';
          </script>
        </body>
      </html>
    `
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
  
  // If not a development request, redirect to normal dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
}