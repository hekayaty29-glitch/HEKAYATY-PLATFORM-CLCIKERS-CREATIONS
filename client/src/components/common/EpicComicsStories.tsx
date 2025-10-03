import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import StoryCard from "@/components/common/StoryCard";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";

export default function EpicComicsStories() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();
  
  const { data: stories, isLoading } = useQuery({
    queryKey: ["/comics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/comics");
      return res.json();
    },
  });

  const filteredStories = stories?.filter((story: any) =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.author?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!stories || stories.length === 0) return null;

  return (
    <div className="mt-16">
      <h3 className="font-bangers text-3xl md:text-4xl text-center mb-8 text-blue-700 dark:text-amber-300">
        Epic Comics Stories
      </h3>
      
      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search comic stories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/80 border-purple-500/50 focus:border-purple-500"
        />
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-purple-200 h-48 rounded-t-lg mb-4"></div>
              <div className="bg-purple-200 h-4 rounded mb-2"></div>
              <div className="bg-purple-200 h-3 rounded mb-2"></div>
              <div className="bg-purple-200 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story: any) => {
            const handleClick = (e: React.MouseEvent) => {
              if (!isAuthenticated) {
                e.preventDefault();
                // Store the intended destination
                localStorage.setItem('redirectAfterLogin', `/story/${story.id}`);
                // Redirect to login
                window.location.href = '/login';
              }
            };

            return (
              <Link key={story.id} href={isAuthenticated ? `/story/${story.id}` : '/login'}>
                <div 
                  className="bg-white/80 border-purple-500/30 rounded-lg overflow-hidden border hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group relative"
                  onClick={handleClick}
                >
                  {/* Comic Cover Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={story.coverImage || story.cover_url || "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center"}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 via-purple-900/20 to-transparent" />
                    
                    {/* Lock overlay for non-authenticated users */}
                    {!isAuthenticated && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-purple-500 text-white p-3 rounded-full shadow-lg">
                          <Lock className="h-6 w-6" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="font-bangers text-lg font-bold mb-2 text-purple-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    
                    <p className="text-gray-700 text-sm mb-2">
                      by {story.author?.fullName || story.author_name || 'Unknown Author'}
                    </p>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
                      {story.description || 'An exciting comic adventure awaits!'}
                    </p>
                    
                    {/* Sign in prompt for non-authenticated users */}
                    {!isAuthenticated && (
                      <div className="text-center">
                        <span className="inline-flex items-center gap-2 text-purple-600 text-sm font-medium">
                          <Lock className="h-4 w-4" />
                          Sign in to read
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <p className="text-white/90">No comic stories found matching your search</p>
        </div>
      ) : null}
    </div>
  );
}
