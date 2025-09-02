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

    // GET /projects - List user projects
    if (method === 'GET' && pathSegments.length === 1) {
      const user = await requireAuth(req)
      const { searchParams } = url
      const authorId = searchParams.get('authorId') || user.id

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /projects - Create project
    if (method === 'POST' && pathSegments.length === 1) {
      const user = await requireAuth(req)
      const body = await req.json()

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...body,
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

    // GET /projects/:id - Get single project
    if (method === 'GET' && pathSegments.length === 2) {
      const user = await requireAuth(req)
      const projectId = pathSegments[1]

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('author_id', user.id)
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /projects/:id - Update project
    if (method === 'PUT' && pathSegments.length === 2) {
      const user = await requireAuth(req)
      const projectId = pathSegments[1]
      const body = await req.json()

      const { data, error } = await supabase
        .from('projects')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('author_id', user.id)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /projects/:id - Delete project
    if (method === 'DELETE' && pathSegments.length === 2) {
      const user = await requireAuth(req)
      const projectId = pathSegments[1]

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('author_id', user.id)

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
