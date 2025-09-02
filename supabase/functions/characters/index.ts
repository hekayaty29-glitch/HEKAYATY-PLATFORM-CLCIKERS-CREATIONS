import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { requireAuth, requireAdmin } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // GET /characters - List all characters
    if (method === 'GET' && pathSegments.length === 1) {
      const { data, error } = await supabase
        .from('legendary_characters')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching characters:', error)
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /characters/:id - Get single character
    if (method === 'GET' && pathSegments.length === 2) {
      const characterId = pathSegments[1]

      const { data, error } = await supabase
        .from('legendary_characters')
        .select('*')
        .eq('id', characterId)
        .single()

      if (error) {
        console.error('Error fetching character:', error)
        return new Response(JSON.stringify({ error: 'Character not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /characters - Create character
    if (method === 'POST' && pathSegments.length === 1) {
      await requireAuth(req)
      const body = await req.json()

      const { data, error } = await supabase
        .from('characters')
        .insert({
          ...body,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /characters/:id - Update character (admin only)
    if (method === 'PUT' && pathSegments.length === 2) {
      await requireAdmin(req)
      const characterId = pathSegments[1]
      const body = await req.json()

      const { data, error } = await supabase
        .from('characters')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', characterId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /characters/:id - Delete character (admin only)
    if (method === 'DELETE' && pathSegments.length === 2) {
      await requireAdmin(req)
      const characterId = pathSegments[1]

      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
