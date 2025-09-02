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

    // GET /stories/special - Get special stories
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'special') {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles(username, full_name, avatar_url)
        `)
        .eq('is_published', true)
        // .eq('category', 'top') // Remove category filter to show all published stories
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/gems - Get gem stories
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'gems') {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles(username, full_name, avatar_url)
        `)
        .eq('is_published', true)
        // .eq('placement', 'gems') // Remove placement filter to show all published stories
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/workshops - Get workshop stories
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'workshops') {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles(username, full_name, avatar_url)
        `)
        .eq('is_published', true)
        // .eq('placement', 'workshops') // Remove placement filter to show all published stories
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories - List stories with filters
    if (method === 'GET' && pathSegments.length === 1) {
      const { searchParams } = url
      const genre = searchParams.get('genre')
      const author = searchParams.get('author')
      const premium = searchParams.get('premium')
      const shortStory = searchParams.get('shortStory')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')

      let query = supabase
        .from('stories')
        .select(`
          *,
          profiles(username, full_name, avatar_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (genre) query = query.eq('genres.name', genre)
      if (author) query = query.eq('profiles.username', author)
      if (premium) query = query.eq('is_premium', premium === 'true')
      if (shortStory) query = query.eq('is_short_story', shortStory === 'true')

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/:id - Get single story
    if (method === 'GET' && pathSegments.length === 2) {
      const storyId = pathSegments[1]
      
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_author_id_fkey(username, full_name, avatar_url),
          story_chapters(*),
          genres(name, icon)
        `)
        .eq('id', storyId)
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /stories - Create new story
    if (method === 'POST' && pathSegments.length === 1) {
      const user = await requireAuth(req)
      const body = await req.json()

      const { data, error } = await supabase
        .from('stories')
        .insert({
          ...body,
          author_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /stories/:id - Update story
    if (method === 'PUT' && pathSegments.length === 2) {
      const user = await requireAuth(req)
      const storyId = pathSegments[1]
      const body = await req.json()

      // Check ownership
      const { data: story } = await supabase
        .from('stories')
        .select('author_id')
        .eq('id', storyId)
        .single()

      if (story?.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase
        .from('stories')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /stories/:id - Delete story
    if (method === 'DELETE' && pathSegments.length === 2) {
      const user = await requireAuth(req)
      const storyId = pathSegments[1]

      // Check ownership
      const { data: story } = await supabase
        .from('stories')
        .select('author_id')
        .eq('id', storyId)
        .single()

      if (story?.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

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
