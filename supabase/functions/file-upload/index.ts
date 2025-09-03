import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // File validation
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'audio/mpeg',
      'audio/wav'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'File type not supported' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Size limit: 50MB
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large (max 50MB)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Upload to Cloudinary
    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('upload_preset', 'novelnexus_unsigned')
    
    // For PDFs, use auto resource type to let Cloudinary handle it properly
    if (file.type === 'application/pdf') {
      uploadData.append('resource_type', 'auto')
    }

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/upload`,
      {
        method: 'POST',
        body: uploadData
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.text()
      return new Response(JSON.stringify({ 
        error: 'Upload failed',
        details: errorData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = await cloudinaryResponse.json()

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      resourceType: result.resource_type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
