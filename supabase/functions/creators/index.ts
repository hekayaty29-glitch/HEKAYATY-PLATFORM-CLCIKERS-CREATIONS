import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

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

    if (method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /creators/top - Get top creators
    if (pathSegments.length === 2 && pathSegments[1] === 'top') {
      const { searchParams } = url
      const limit = parseInt(searchParams.get('limit') || '5')

      const { data, error } = await supabase
        .rpc('get_top_creators', { limit_count: limit })

      if (error) {
        // Fallback query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            *,
            stories!stories_author_id_fkey(id),
            comics!comics_author_id_fkey(id)
          `)
          .limit(limit)

        if (fallbackError) throw fallbackError

        const creators = fallbackData?.map(profile => ({
          ...profile,
          story_count: profile.stories?.length || 0,
          comic_count: profile.comics?.length || 0,
          total_works: (profile.stories?.length || 0) + (profile.comics?.length || 0)
        })).sort((a, b) => b.total_works - a.total_works)

        return new Response(JSON.stringify(creators), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /creators - List all creators
    if (pathSegments.length === 1) {
      const { searchParams } = url
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, username, full_name, avatar_url, bio, role,
          stories!stories_author_id_fkey(id),
          comics!comics_author_id_fkey(id)
        `)
        .range(offset, offset + limit - 1)

      if (error) throw error

      const creators = data?.map(profile => ({
        ...profile,
        story_count: profile.stories?.length || 0,
        comic_count: profile.comics?.length || 0
      }))

      return new Response(JSON.stringify(creators), {
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
