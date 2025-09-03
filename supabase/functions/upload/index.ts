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
    
    // Try different field names for file uploads
    const file = formData.get('file') as File || 
                 formData.get('avatar') as File ||
                 formData.get('cover') as File ||
                 formData.get('poster') as File ||
                 formData.get('pdf') as File ||
                 formData.get('images') as File
    
    const folder = formData.get('folder') as string || 'general'

    console.log('File found:', file ? file.name : 'No file')
    console.log('Folder:', folder)
    
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

    // Upload to Cloudinary - TEST WITH UNSIGNED UPLOAD
    console.log('Testing Cloudinary upload without signature...')
    
    // Use appropriate Cloudinary endpoint based on file type
    const cloudinaryUrl = file.type === 'application/pdf' 
      ? `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/raw/upload`
      : `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/upload`
    
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('folder', `hekayaty/${folder}`)
    
    // Use different upload preset for PDFs to preserve format
    if (file.type === 'application/pdf') {
      uploadFormData.append('upload_preset', 'novelnexus_unsigned')
      uploadFormData.append('resource_type', 'raw') // Preserve PDF format
    } else {
      uploadFormData.append('upload_preset', 'novelnexus_unsigned')
    }
    
    console.log('Cloudinary upload attempt:', {
      cloudName: Deno.env.get('CLOUDINARY_CLOUD_NAME'),
      folder: `hekayaty/${folder}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: cloudinaryUrl
    })

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadFormData
    })

    const uploadResult = await uploadResponse.json()

    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error?.message || 'Upload failed')
    }

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
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
