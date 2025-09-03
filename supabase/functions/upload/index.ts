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
    cloudinaryFormData.append('folder', `hekayaty/${folder}`)

    console.log('Sending to Cloudinary...')
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
    
    let uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`
    
    // For PDFs, use signed upload with API credentials
    if (file.type === 'application/pdf') {
      cloudinaryFormData.append('resource_type', 'raw')
      
      // Add API credentials for signed upload
      const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
      const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')
      
      if (apiKey && apiSecret) {
        // Generate timestamp for signature
        const timestamp = Math.round(Date.now() / 1000)
        cloudinaryFormData.append('timestamp', timestamp.toString())
        cloudinaryFormData.append('api_key', apiKey)
        
        // Create signature with only the parameters that will be signed
        // Note: resource_type is sent in form data but not included in signature for raw uploads
        const signatureString = `folder=hekayaty/${folder}&timestamp=${timestamp}${apiSecret}`
        
        const signature = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signatureString))
        const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
        cloudinaryFormData.append('signature', signatureHex)
        
        uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
      } else {
        // Fallback to unsigned upload with auto resource type
        cloudinaryFormData.append('upload_preset', 'novelnexus_unsigned')
        cloudinaryFormData.delete('resource_type')
        console.log('No API credentials found, using unsigned upload')
      }
    } else {
      // For non-PDF files, use unsigned upload
      cloudinaryFormData.append('upload_preset', 'novelnexus_unsigned')
    }

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData
    })

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
