import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { requireAuth } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    console.log('Upload function called')
    
    const user = await requireAuth(req)
    console.log('User authenticated:', user.id)
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Parsing form data...')
    const formData = await req.formData()
    console.log('Form data parsed successfully')
    
    const file = formData.get('file') as File

    console.log('File found:', file ? file.name : 'No file')
    
    if (!file) {
      console.error('No file provided in form data')
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/wav']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Simple direct upload to Cloudinary
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('upload_preset', 'novelnexus_unsigned')
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/upload`

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadFormData
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Cloudinary upload failed: ${uploadResponse.status} - ${errorText}`)
    }

    const uploadResult = await uploadResponse.json()

    // Log upload activity (optional - don't fail if table doesn't exist)
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'file_upload',
          details: {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            cloudinary_id: uploadResult.public_id
          },
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Failed to log upload activity:', logError)
    }

    return new Response(JSON.stringify({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      size: uploadResult.bytes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload function error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause
    })
    return new Response(JSON.stringify({ 
      error: `Upload failed: ${error.message}`,
      type: error.name,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
