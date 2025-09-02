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
    const user = await requireAuth(req)
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'

    if (!file) {
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

    // Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${Deno.env.get('CLOUDINARY_CLOUD_NAME')}/auto/upload`
    
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('folder', `hekayaty/${folder}`)
    uploadFormData.append('api_key', Deno.env.get('CLOUDINARY_API_KEY') ?? '')
    
    // Generate signature for secure upload
    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = `folder=hekayaty/${folder}&timestamp=${timestamp}`
    
    const signature = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(Deno.env.get('CLOUDINARY_API_SECRET') ?? ''),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    ).then(key => 
      crypto.subtle.sign('HMAC', key, new TextEncoder().encode(paramsToSign))
    ).then(signature => 
      Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    )

    uploadFormData.append('timestamp', timestamp.toString())
    uploadFormData.append('signature', signature)

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadFormData
    })

    const uploadResult = await uploadResponse.json()

    if (!uploadResponse.ok) {
      throw new Error(uploadResult.error?.message || 'Upload failed')
    }

    // Log upload activity
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

    return new Response(JSON.stringify({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      size: uploadResult.bytes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
