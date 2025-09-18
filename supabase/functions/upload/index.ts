import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
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

    // Upload to Cloudinary - use different accounts for different file types
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', file)

    console.log('Sending to Cloudinary...')
    
    let uploadUrl, cloudName
    
    // For PDFs, use dedicated PDF Cloudinary account with signed upload
    if (file.type === 'application/pdf') {
      cloudName = Deno.env.get('PDF_CLOUDINARY_CLOUD_NAME')
      const apiKey = Deno.env.get('PDF_CLOUDINARY_API_KEY')
      const apiSecret = Deno.env.get('PDF_CLOUDINARY_API_SECRET')
      
      if (cloudName && apiKey && apiSecret) {
        cloudinaryFormData.append('resource_type', 'raw')
        cloudinaryFormData.append('folder', `documents/${folder}`)
        
        // Generate timestamp for signature
        const timestamp = Math.round(Date.now() / 1000)
        cloudinaryFormData.append('timestamp', timestamp.toString())
        cloudinaryFormData.append('api_key', apiKey)
        
        // Create signature for signed upload - only include parameters that Cloudinary will sign
        // For raw uploads, resource_type is NOT included in signature
        const signatureString = `folder=documents/${folder}&timestamp=${timestamp}${apiSecret}`
        console.log('Signature string:', signatureString)
        const signature = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signatureString))
        const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
        cloudinaryFormData.append('signature', signatureHex)
        
        uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
        console.log('Using PDF Cloudinary account for raw upload')
      } else {
        console.error('PDF Cloudinary credentials not found')
        return new Response(JSON.stringify({ 
          error: 'PDF upload configuration missing' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      // For images/other files, use existing account with unsigned upload
      cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
      cloudinaryFormData.append('upload_preset', 'novelnexus_unsigned')
      cloudinaryFormData.append('folder', `hekayaty/${folder}`)
      uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`
      console.log('Using main Cloudinary account for image upload')
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
