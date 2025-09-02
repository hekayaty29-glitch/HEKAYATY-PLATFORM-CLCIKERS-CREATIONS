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

    if (method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { searchParams } = url
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all' // stories, comics, users, all
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return new Response(JSON.stringify({ error: 'Search query required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results: any = {}

    // Search stories
    if (type === 'stories' || type === 'all') {
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_author_id_fkey(username, full_name, avatar_url)
        `)
        .eq('is_published', true)
        .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
        .limit(limit)

      results.stories = stories || []
    }

    // Search comics
    if (type === 'comics' || type === 'all') {
      const { data: comics } = await supabase
        .from('comics')
        .select(`
          *,
          profiles!comics_author_id_fkey(username, full_name, avatar_url)
        `)
        .eq('is_published', true)
        .or(`title.ilike.%${query}%, description.ilike.%${query}%`)
        .limit(limit)

      results.comics = comics || []
    }

    // Search users
    if (type === 'users' || type === 'all') {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .or(`username.ilike.%${query}%, full_name.ilike.%${query}%`)
        .limit(limit)

      results.users = users || []
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
