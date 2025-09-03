import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pdfUrl = url.searchParams.get('url')
    
    if (!pdfUrl) {
      return new Response('PDF URL is required', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    // Fetch the PDF from Cloudinary with proper headers
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return new Response('Failed to fetch PDF', { 
        status: response.status,
        headers: corsHeaders 
      })
    }

    // Return the PDF with proper headers
    const pdfBuffer = await response.arrayBuffer()
    
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600'
      }
    })

  } catch (error) {
    console.error('PDF proxy error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
