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

    if (method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await requireAdmin(req)

    // GET /analytics/dashboard - Dashboard stats
    if (pathSegments.length === 2 && pathSegments[1] === 'dashboard') {
      const [
        { count: totalUsers },
        { count: totalStories },
        { count: totalComics },
        { count: publishedStories },
        { count: vipUsers }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('comics').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vip')
      ])

      // Recent activity
      const { data: recentStories } = await supabase
        .from('stories')
        .select(`
          id, title, created_at, is_published,
          profiles!stories_author_id_fkey(username, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      const stats = {
        totalUsers: totalUsers || 0,
        totalStories: totalStories || 0,
        totalComics: totalComics || 0,
        publishedStories: publishedStories || 0,
        vipUsers: vipUsers || 0,
        recentActivity: recentStories || []
      }

      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /analytics/metrics - Detailed metrics
    if (pathSegments.length === 2 && pathSegments[1] === 'metrics') {
      const { searchParams } = url
      const period = searchParams.get('period') || '30' // days

      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - parseInt(period))

      const [
        { data: newUsers },
        { data: newStories },
        { data: topGenres },
        { data: topRatedStories }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', dateFrom.toISOString()),
        supabase
          .from('stories')
          .select('created_at, genre_id')
          .gte('created_at', dateFrom.toISOString()),
        supabase
          .from('stories')
          .select(`
            genre_id,
            genres!stories_genre_id_fkey(name)
          `)
          .eq('is_published', true),
        supabase
          .from('stories')
          .select(`
            id, title, average_rating,
            profiles!stories_author_id_fkey(username)
          `)
          .eq('is_published', true)
          .not('average_rating', 'is', null)
          .order('average_rating', { ascending: false })
          .limit(10)
      ])

      const metrics = {
        newUsersCount: newUsers?.length || 0,
        newStoriesCount: newStories?.length || 0,
        topGenres: topGenres || [],
        topRatedStories: topRatedStories || [],
        period: parseInt(period)
      }

      return new Response(JSON.stringify(metrics), {
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
