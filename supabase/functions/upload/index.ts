import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Upload request received')
    
    // Get form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      console.log('No file provided')
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`)

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)
    cloudinaryFormData.append('upload_preset', 'novelnexus_unsigned')
    cloudinaryFormData.append('folder', `hekayaty/${folder}`)

    // For PDFs, ensure they remain as PDFs and force download
    if (file.type === 'application/pdf') {
      cloudinaryFormData.append('resource_type', 'raw')
      cloudinaryFormData.append('flags', 'attachment')
    }

    console.log('Sending to Cloudinary...')
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData
      }
    )

    const result = await response.json()
    console.log('Cloudinary response:', response.status, result)

    if (!response.ok) {
      console.error('Cloudinary upload failed:', result)
      return new Response(JSON.stringify({ 
        error: 'Upload failed',
        details: result
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Upload successful:', result.secure_url)
    return new Response(JSON.stringify({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
