import { Gem, Search, Lock } from "lucide-react";
import bgImg from "@/assets/61e25244-e0d4-460d-907d-86223aad6ba0.png";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

// Fetch all published stories to show to everyone
const useGemStories = () =>
  useQuery<any[]>({
    queryKey: ["/stories/all-public"],
    queryFn: async () => {
      try {
        console.log('Fetching all published stories for public display...');
        const res = await apiRequest("GET", "/stories?is_published=true");
        const data = await res.json();
        console.log('Public stories response:', data);
        
        if (!Array.isArray(data)) {
          console.warn('Stories response is not an array:', data);
          return [];
        }
        
        // Transform and limit to first 6 stories for homepage
        const validStories = data
          .filter(story => story && story.id && story.title)
          .slice(0, 6) // Show only 6 stories on homepage
          .map(story => ({
            ...story,
            id: typeof story.id === 'string' ? story.id : String(story.id),
            coverImage: story.coverImage || story.cover_url || '',
            author: story.author || { fullName: story.author_name || 'Unknown Author' },
            description: story.description || story.synopsis || 'A captivating story from our community.',
          }));
        
        console.log(`Found ${validStories.length} valid stories for public display`);
        return validStories;
      } catch (error) {
        console.error('Error fetching public stories:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

// removed mock array
/* const gemStories = [
  {
    id: 401,
    title: "The Sapphire Enigma",
    author: "Cassia Bluewind",
    cover: "💎",
  },
  {
    id: 402,
    title: "Emerald Dawn",
    author: "Orion Greenleaf",
    cover: "💚",
  },
  {
    id: 403,
    title: "Ruby Heartbeat",
    author: "Scarlet Ember",
    cover: "❤️",
  },
*/

export default function WritersGemsSection() {
  const [search, setSearch] = useState("");
  const { isAuthenticated } = useAuth();
  const { data: gemStories, isLoading } = useGemStories();
  const filtered = (gemStories || []).filter((s: any) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <section
        className="relative py-16 px-4 bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <div className="container mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse bg-amber-50/10 rounded h-40" />
            ))}
        </div>
      </section>
    );
  }

  if (!filtered.length) {
    return (
      <section
        className="relative py-16 px-4 text-center bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        <Link href="/gems" className="group">
          <h3 className="font-cinzel text-2xl md:text-3xl text-amber-50 group-hover:text-amber-400 transition-colors">Browse Writer's Gems</h3>
        </Link>
        
        {!isAuthenticated ? (
          <div className="mt-8 space-y-4">
            <p className="font-cormorant italic text-lg text-amber-200 max-w-2xl mx-auto">
              Uncover precious literary gems from our community of writers. Each story is a treasure waiting to be discovered!
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-900 font-cinzel font-bold text-lg rounded-full shadow-lg hover:from-amber-400 hover:to-amber-500 transform hover:scale-105 transition-all duration-300"
            >
              Sign In to Discover Gems
            </Link>
            <p className="text-amber-300 text-sm font-medium">
              💎 Unlock a treasure trove of amazing stories 💎
            </p>
          </div>
        ) : (
          <>
            <p className="font-cormorant italic mt-2 text-amber-200">No gem stories available currently.</p>
            <Link
              href="/publish"
              className="inline-block mt-6 px-6 py-3 bg-amber-400 text-brown-dark font-semibold rounded shadow hover:bg-amber-500 transition-colors"
            >
              Publish your workshop gem
            </Link>
          </>
        )}
      </section>
    );
  }

  return (
    <section
      className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute inset-0 bg-brown-dark/40" />
      <div className="relative container mx-auto max-w-6xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Gem className="h-6 w-6 text-amber-400" />
          <Link href="/gems" className="hover:text-amber-400 transition-colors">
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-center">
              Writer's Gems
            </h2>
          </Link>
          <Gem className="h-6 w-6 text-amber-400" />
        </div>
        <div className="text-center mb-8">
          <Link
            href="/publish"
            className="inline-block px-6 py-3 bg-amber-400 text-brown-dark font-semibold rounded shadow hover:bg-amber-500 transition-colors"
          >
            Publish your workshop gem
          </Link>
        </div>
        <div className="relative max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search winning stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((story, index) => {
            // Fallback images for stories without cover images
            const fallbackImages = [
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center", // Library
              "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center", // Writing
              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&crop=center", // Books
              "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop&crop=center", // Fantasy
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center", // Adventure
              "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop&crop=center", // Magic
            ];
            
            const coverImage = story.coverImage || fallbackImages[index % fallbackImages.length];
            const authorName = typeof story.author === 'string' ? story.author : story.author?.fullName || 'Unknown Author';
            
            // For non-authenticated users, show cards but redirect to login on click
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
                  className="story-card bg-amber-50 bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-lg overflow-hidden border border-amber-500 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group relative"
                  onClick={handleClick}
                >
                  {/* Story Cover Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={coverImage}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brown-dark/70 via-brown-dark/20 to-transparent" />
                    
                    {/* Lock Icon for Non-Authenticated Users */}
                    {!isAuthenticated && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-amber-500 text-amber-900 p-3 rounded-full shadow-lg">
                          <Lock className="h-6 w-6" />
                        </div>
                      </div>
                    )}
                    
                    {/* Story Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-cinzel text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors line-clamp-2">
                        {story.title}
                      </h3>
                      <p className="text-amber-200 text-sm font-medium">
                        by {authorName}
                      </p>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-4">
                    {/* Description */}
                    <p className="text-amber-50/80 text-sm leading-relaxed line-clamp-3">
                      {story.description}
                    </p>
                    
                    {/* Sign In Prompt for Non-Authenticated Users */}
                    {!isAuthenticated && (
                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium">
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
      </div>
    </section>
  );
}
