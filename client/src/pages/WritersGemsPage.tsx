import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Award, Star, Crown } from "lucide-react";
import { Link } from "wouter";
import { formatDate, truncateText } from "@/lib/utils";
import gemsBackground from "@/assets/61e25244-e0d4-460d-907d-86223aad6ba0.png";

// Custom Gem Story Card with beautiful design
function GemStoryCard({ story }: { story: any }) {
  // Fallback images for different story types
  const fallbackImages = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=center", // Book/Library
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&crop=center", // Writing/Manuscript
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&crop=center", // Books/Literature
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&crop=center", // Cosmic/Fantasy
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=center", // Steampunk/Adventure
  ];
  
  const coverImage = story.coverImage || story.cover_url || fallbackImages[story.id % fallbackImages.length];
  
  return (
    <Link
      href={`/story/${story.id}`}
      className="gem-card group relative bg-gradient-to-br from-amber-100/20 via-yellow-50/20 to-amber-200/20 backdrop-blur-sm rounded-xl border border-amber-300/30 hover:border-amber-400/50 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col touch-manipulation"
    >
      {/* Winner Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
          <Crown className="h-3 w-3" />
          <span>GEM</span>
        </div>
      </div>
      
      {/* Story Cover Image */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <img
          src={coverImage}
          alt={`Cover for ${story.title}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge */}
        {story.averageRating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{story.averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Story Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col bg-gradient-to-b from-white/10 to-amber-50/10">
        <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors line-clamp-2">
          {story.title}
        </h3>
        
        <p className="text-amber-200 text-xs sm:text-sm mb-3 font-medium">
          by {story.author?.fullName || story.author_name || 'Unknown Author'}
        </p>
        
        <p className="text-white/90 text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
          {truncateText(story.description || 'A captivating story that won our community competition.', 120)}
        </p>
        
        {/* Story Stats */}
        <div className="flex items-center justify-between text-xs text-amber-300/80 mb-4">
          <span>{formatDate(story.createdAt || story.created_at)}</span>
          {story.ratingCount > 0 && (
            <span>{story.ratingCount} reviews</span>
          )}
        </div>
        
        {/* Read Button */}
        <div className="mt-auto">
          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 group-hover:from-amber-400 group-hover:to-yellow-400 text-amber-900 font-cinzel font-bold text-sm py-2.5 px-4 sm:px-6 rounded-full transition-all shadow-lg">
            <Award className="h-4 w-4" />
            Read Gem →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function WritersGemsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: stories, isLoading, error } = useQuery({
    queryKey: ["/api/stories", { all: true }],
    queryFn: async () => {
      try {
        console.log('Fetching all published stories for Writer\'s Gems...');
        const res = await apiRequest("GET", "/stories?is_published=true");
        const data = await res.json();
        console.log('All stories response:', data);
        
        // Ensure we have valid data and transform if needed
        if (!Array.isArray(data)) {
          console.warn('Stories response is not an array:', data);
          return [];
        }
        
        // Filter and transform stories to ensure they have required fields
        const validStories = data
          .filter(story => story && story.id && story.title && typeof story.title === 'string')
          .map(story => ({
            ...story,
            // Ensure consistent field names
            id: typeof story.id === 'string' ? story.id : String(story.id),
            coverImage: story.coverImage || story.cover_url || '',
            author: story.author || {
              fullName: story.author_name || 'Unknown Author'
            },
            averageRating: story.averageRating || story.average_rating || 0,
            ratingCount: story.ratingCount || story.rating_count || 0,
            createdAt: story.createdAt || story.created_at || new Date().toISOString(),
          }));
        
        console.log(`Found ${validStories.length} valid published stories`);
        return validStories;
      } catch (error) {
        console.error('Error fetching stories:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });

  const filteredStories = stories?.filter((story: any) =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.author?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <>
      <Helmet>
        <title>Writer's Gems - All Stories</title>
        <meta
          name="description"
          content="Discover all published stories on HEKAYATY - from award-winning gems to community favorites."
        />
      </Helmet>

      <div
        className="bg-cover bg-center bg-fixed bg-gradient-to-b from-purple-900/40 to-amber-900/30 min-h-screen pt-6 sm:pt-8 pb-12 sm:pb-16"
        style={{ backgroundImage: `url(${gemsBackground})` }}
      >
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400" />
              <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Writer's Gems
              </h1>
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400" />
            </div>
            <p className="text-white/90 max-w-2xl mx-auto mb-6 text-sm sm:text-base px-4">
              Discover all published stories on HEKAYATY - from award-winning gems to community favorites
            </p>
            
            {/* Publish Button */}
            <div className="mb-6 sm:mb-8">
              <Link 
                href="/publish"
                className="inline-block px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-amber-900 font-cinzel font-semibold text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl transition-all touch-manipulation"
              >
                ✨ Publish Your Gem
              </Link>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto px-4">
              <Input
                placeholder="Search all stories, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 sm:py-4 pl-4 pr-12 rounded-full bg-white/10 backdrop-blur-sm placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 border-white/20 focus:border-amber-400 text-base touch-manipulation min-h-[48px]"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            </div>
          </div>

          {/* Stats */}
          <div className="text-center mb-6 sm:mb-8 px-4">
            <p className="text-amber-300/80 text-sm sm:text-base">
              {isLoading ? (
                "Loading stories..."
              ) : error ? (
                "Error loading stories"
              ) : (
                <>
                  Showing {filteredStories.length} of {stories?.length || 0} stories
                  {searchQuery && ` matching "${searchQuery}"`}
                </>
              )}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-center py-6 sm:py-8 bg-red-50/10 rounded-lg border border-red-500/20 mb-6 mx-4">
              <Award className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="font-cinzel text-lg sm:text-xl text-white mb-2 px-4">Error Loading Stories</h3>
              <p className="text-white/80 text-sm sm:text-base px-4">
                Failed to load stories. Please try refreshing the page.
              </p>
            </div>
          )}

          {/* Stories Grid */}
          {!error && isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-amber-50/10 rounded-xl border border-amber-300/30 overflow-hidden">
                  <div className="bg-gradient-to-br from-amber-200/30 to-yellow-200/30 h-48 sm:h-56 md:h-64"></div>
                  <div className="p-4 sm:p-5">
                    <div className="bg-amber-200/30 h-4 rounded mb-3"></div>
                    <div className="bg-amber-200/20 h-3 rounded mb-2"></div>
                    <div className="bg-amber-200/20 h-3 rounded w-2/3 mb-4"></div>
                    <div className="bg-amber-300/30 h-8 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : !error && filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredStories.map((story: any) => (
                <GemStoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : !error ? (
            <div className="text-center py-12 sm:py-16 bg-white/5 backdrop-blur-sm rounded-xl border border-amber-300/20 mx-4">
              <Award className="h-12 w-12 sm:h-16 sm:w-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-cinzel font-bold text-white mb-2 px-4">
                {searchQuery ? "No stories found" : "No stories available"}
              </h3>
              <p className="text-white/80 text-sm sm:text-base px-4 max-w-md mx-auto">
                {searchQuery 
                  ? "Try adjusting your search terms to find stories" 
                  : "No published stories are available at the moment. Check back later!"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-block mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-900 font-cinzel font-bold text-sm py-3 px-6 rounded-full transition-all shadow-lg touch-manipulation"
                >
                  Clear Search
                </button>
              )}
              {!searchQuery && (
                <Link 
                  href="/publish"
                  className="inline-block mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-900 font-cinzel font-bold text-sm py-3 px-6 rounded-full transition-all shadow-lg touch-manipulation"
                >
                  Publish Your Story
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
