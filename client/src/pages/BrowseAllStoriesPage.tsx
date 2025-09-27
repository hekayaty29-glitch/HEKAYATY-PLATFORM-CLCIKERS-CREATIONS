import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, AlertTriangle } from "lucide-react";
import { StoryCard as StoryCardType } from "@/lib/types";
import StoryCard from "@/components/story/StoryCard";
import Container from "@/components/layout/Container";

// Interface for API response that might have different field names
interface ApiStoryResponse {
  id: number | string;
  title: string;
  description?: string;
  coverImage?: string;
  cover_url?: string;
  author_name?: string;
  author?: any;
  averageRating?: number;
  average_rating?: number;
  ratingCount?: number;
  rating_count?: number;
  isPremium?: boolean;
  is_premium?: boolean;
  isPublished?: boolean;
  is_published?: boolean;
  isShortStory?: boolean;
  is_short_story?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  genres?: any[];
  authorId?: number;
  author_id?: number;
}

export default function BrowseAllStoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Simple fetch all published stories
  const { data: stories = [], isLoading, error } = useQuery<StoryCardType[]>({
    queryKey: ["/all-stories"],
    queryFn: async () => {
      try {
        console.log('Fetching all stories...');
        const res = await apiRequest("GET", "/stories?is_published=true");
        const data: ApiStoryResponse[] = await res.json();
        console.log('All stories response:', data);
        
        // Ensure we have valid data
        if (!Array.isArray(data)) {
          console.warn('Stories response is not an array:', data);
          return [];
        }
        
        // Transform API response to match StoryCardType
        const transformedStories: StoryCardType[] = data
          .filter(story => story && story.id && story.title && typeof story.title === 'string')
          .map(story => ({
            id: typeof story.id === 'string' ? parseInt(story.id) : story.id,
            title: story.title,
            description: story.description || '',
            coverImage: story.coverImage || story.cover_url || '',
            authorId: story.authorId || story.author_id || 0,
            isPremium: story.isPremium || story.is_premium || false,
            isPublished: story.isPublished || story.is_published || true,
            isShortStory: story.isShortStory || story.is_short_story || false,
            createdAt: story.createdAt || story.created_at || new Date().toISOString(),
            updatedAt: story.updatedAt || story.updated_at || new Date().toISOString(),
            averageRating: story.averageRating || story.average_rating || 0,
            ratingCount: story.ratingCount || story.rating_count || 0,
            genres: story.genres || [],
            author: story.author || {
              id: story.authorId || story.author_id || 0,
              username: 'unknown',
              fullName: story.author_name || 'Unknown Author',
              avatarUrl: ''
            }
          }));
        
        console.log(`Found ${transformedStories.length} valid stories`);
        return transformedStories;
      } catch (error) {
        console.error('Error fetching all stories:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });

  // Simple search filter
  const filteredStories = stories.filter((story) =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (story.description && story.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (story.author && story.author.fullName && story.author.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900/20 to-brown-dark text-amber-50">
      <Helmet>
        <title>Browse All Stories - HEKAYATY</title>
        <meta name="description" content="Discover all published stories on HEKAYATY platform" />
      </Helmet>

      <Container>
        <div className="py-8 px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-amber-400" />
              <h1 className="font-cinzel text-4xl md:text-5xl font-bold">
                Browse All Stories
              </h1>
              <BookOpen className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-amber-200 text-lg max-w-2xl mx-auto">
              Discover all the amazing stories published on HEKAYATY platform
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Input
              type="text"
              placeholder="Search stories, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 border-amber-500/50"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
          </div>

          {/* Stats */}
          <div className="text-center mb-8">
            <p className="text-amber-300">
              {isLoading ? (
                "Loading stories..."
              ) : error ? (
                "Error loading stories"
              ) : (
                <>
                  Showing {filteredStories.length} of {stories.length} stories
                  {searchQuery && ` matching "${searchQuery}"`}
                </>
              )}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-center py-8 bg-red-50/10 rounded-lg border border-red-500/20 mb-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-cinzel text-xl text-white mb-2">Error Loading Stories</h3>
              <p className="text-white/80">
                Failed to load stories. Please try refreshing the page.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-amber-50/10 rounded-lg h-80 border border-amber-500/20"></div>
              ))}
            </div>
          )}

          {/* Stories Grid */}
          {!isLoading && !error && (
            <>
              {filteredStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredStories.map((story) => (
                    <StoryCard 
                      key={story.id} 
                      story={story} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-amber-50/10 rounded-lg border border-amber-500/20">
                  <BookOpen className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                  <h3 className="font-cinzel text-2xl text-white mb-2">
                    {searchQuery ? "No Stories Found" : "No Stories Available"}
                  </h3>
                  <p className="text-amber-200 max-w-md mx-auto">
                    {searchQuery 
                      ? `No stories match your search for "${searchQuery}". Try a different search term.`
                      : "There are no published stories available at the moment. Check back later for new content!"
                    }
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-brown-dark rounded-full font-medium transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
