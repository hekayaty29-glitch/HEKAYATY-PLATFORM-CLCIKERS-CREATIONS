import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/auth.ts'

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

    // GET /featured - Get featured content
    if (method === 'GET' && pathSegments.length === 1) {
      const { searchParams } = url
      const type = searchParams.get('type') || 'all' // stories, comics, all
      const limit = parseInt(searchParams.get('limit') || '10')

      const results: any = {}

      if (type === 'stories' || type === 'all') {
        const { data: stories } = await supabase
          .from('stories')
          .select(`
            *,
            profiles!stories_author_id_fkey(username, full_name, avatar_url)
          `)
          .eq('is_published', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(limit)

        results.stories = stories || []
      }

      if (type === 'comics' || type === 'all') {
        const { data: comics } = await supabase
          .from('comics')
          .select(`
            *,
            profiles!comics_author_id_fkey(username, full_name, avatar_url)
          `)
          .eq('is_published', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(limit)

        results.comics = comics || []
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /featured/:type/:id - Feature content (admin only)
    if (method === 'POST' && pathSegments.length === 3) {
      await requireAdmin(req)
      const contentType = pathSegments[1] // stories or comics
      const contentId = pathSegments[2]

      const table = contentType === 'stories' ? 'stories' : 'comics'
      
      const { data, error } = await supabase
        .from(table)
        .update({ is_featured: true })
        .eq('id', contentId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await supabase
        .from('audit_logs')
        .insert({
          action: `featured_${contentType}`,
          details: { content_id: contentId },
          created_at: new Date().toISOString()
        })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /featured/:type/:id - Unfeature content (admin only)
    if (method === 'DELETE' && pathSegments.length === 3) {
      await requireAdmin(req)
      const contentType = pathSegments[1]
      const contentId = pathSegments[2]

      const table = contentType === 'stories' ? 'stories' : 'comics'
      
      const { data, error } = await supabase
        .from(table)
        .update({ is_featured: false })
        .eq('id', contentId)
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
