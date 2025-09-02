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
    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // GET /community/workshops - List workshops
    if (method === 'GET' && pathSegments[0] === 'workshops') {
      const { searchParams } = url
      const userId = searchParams.get('userId')
      const limit = parseInt(searchParams.get('limit') || '20')

      let query = supabase
        .from('workshops')
        .select(`
          *,
          profiles!workshops_owner_id_fkey(username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (userId) {
        query = query.eq('owner_id', userId)
      }

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /community/workshops - Create workshop
    if (method === 'POST' && pathSegments[0] === 'workshops') {
      const user = await requireAuth(req)
      const { title, description, category } = await req.json()

      const { data, error } = await supabase
        .from('workshops')
        .insert({
          title,
          description,
          category,
          owner_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /community/posts - List posts
    if (method === 'GET' && pathSegments[0] === 'posts') {
      const { searchParams } = url
      const workshopId = searchParams.get('workshopId')
      const limit = parseInt(searchParams.get('limit') || '20')

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey(username, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (workshopId) {
        query = query.eq('workshop_id', workshopId)
      }

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /community/posts - Create post
    if (method === 'POST' && pathSegments[0] === 'posts') {
      const user = await requireAuth(req)
      const { title, content, workshopId } = await req.json()

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          workshop_id: workshopId,
          author_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
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
