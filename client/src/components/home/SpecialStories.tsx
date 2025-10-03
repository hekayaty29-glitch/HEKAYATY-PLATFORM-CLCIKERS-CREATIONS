import { Star, Search, Lock } from "lucide-react";
import bgImg from "@/assets/00a75467-b343-4cf1-a5c7-0b7d1270efc4.png";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

interface Story {
  id: number;
  title: string;
  author: string;
  cover: string;
  genre: string;
  category: "top" | "collection";
}

// Fetch special stories
const useSpecialStories = () =>
  useQuery({
    queryKey: ['/stories/special'],
    queryFn: async () => {
      console.log('Fetching special stories...');
      const response = await apiRequest('GET', '/stories/special')
      const data = await response.json()
      console.log('Special stories response:', data);
      return data
    }
  });

export default function SpecialStories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const { isAuthenticated } = useAuth();

  const { data: stories, isLoading, error } = useSpecialStories();

  const genres = Array.from(new Set((stories || []).map((s: any) => s.genre)));

  const filtered = (stories || []).filter((s: any) => {
    const matchGenre = selectedGenre === "all" || s.genre === selectedGenre;
    const matchTitle = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGenre && matchTitle;
  });

  const topRated = filtered.filter((s) => s.category === "top");
  const bestCollections = filtered.filter((s) => s.category === "collection");

  if (isLoading) {
    return (
      <section
        className="relative py-16 px-4 bg-center bg-cover"
        style={{ backgroundImage: `url(${bgImg})` }}
        id="special-stories"
      >
        <div className="container mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
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
        id="special-stories"
      >
        <Link href="/special" className="group">
          <h3 className="font-cinzel text-2xl md:text-3xl text-amber-50 group-hover:text-amber-400 transition-colors">Browse Special Stories</h3>
        </Link>
        
        {!isAuthenticated ? (
          <div className="mt-8 space-y-4">
            <p className="font-cormorant italic text-lg text-amber-200 max-w-2xl mx-auto">
              Discover handpicked special stories and exclusive collections. Premium tales await your exploration!
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-900 font-cinzel font-bold text-lg rounded-full shadow-lg hover:from-amber-400 hover:to-amber-500 transform hover:scale-105 transition-all duration-300"
            >
              Sign In for Special Stories
            </Link>
            <p className="text-amber-300 text-sm font-medium">
              ⭐ Access exclusive premium collections ⭐
            </p>
          </div>
        ) : (
          <p className="font-cormorant italic mt-2 text-amber-200">No special stories available right now.</p>
        )}
      </section>
    );
  }

  return (
    <section
      className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute inset-0 bg-brown-dark/25" />
      <div className="relative container mx-auto max-w-6xl">
        <Link href="/special#top" className="block">
          <h3 className="font-cinzel text-3xl md:text-4xl mb-6 text-center text-amber-200 hover:text-amber-400 transition-colors">
            Top Rated
          </h3>
        </Link>
        {/* Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-12">
          <div className="relative w-full md:w-2/3">
            <input
              type="text"
              placeholder="Search by story title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
          </div>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="py-3 px-4 rounded-full bg-amber-50/10 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Genres</option>
            {genres.map((g: any) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {topRated.map((story) => {
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
              <Link
                key={story.id}
                href={isAuthenticated ? `/story/${story.id}` : '/login'}
              >
                <div 
                  className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center relative group"
                  onClick={handleClick}
                >
                  {/* Lock overlay for non-authenticated users */}
                  {!isAuthenticated && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="bg-amber-500 text-amber-900 p-3 rounded-full shadow-lg">
                        <Lock className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-6xl mb-4">{story.cover}</div>
                  <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                    {story.title}
                  </h4>
                  <p className="text-amber-200 text-sm mb-3">by {story.author}</p>
                  
                  {/* Sign in prompt for non-authenticated users */}
                  {!isAuthenticated && (
                    <div className="text-center mt-2">
                      <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium">
                        <Lock className="h-4 w-4" />
                        Sign in to read
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Collections */}
        <h3 className="font-cinzel text-2xl mb-6 text-center text-amber-200">Best Collections</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bestCollections.map((story) => {
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
              <Link
                key={story.id}
                href={isAuthenticated ? `/story/${story.id}` : '/login'}
              >
                <div 
                  className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center relative group"
                  onClick={handleClick}
                >
                  {/* Lock overlay for non-authenticated users */}
                  {!isAuthenticated && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="bg-amber-500 text-amber-900 p-3 rounded-full shadow-lg">
                        <Lock className="h-6 w-6" />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-6xl mb-4">{story.cover}</div>
                  <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                    {story.title}
                  </h4>
                  <p className="text-amber-200 text-sm mb-3">{story.author}</p>
                  
                  {/* Sign in prompt for non-authenticated users */}
                  {!isAuthenticated && (
                    <div className="text-center mt-2">
                      <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium">
                        <Lock className="h-4 w-4" />
                        Sign in to read
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/talecraft"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel py-3 px-8 rounded-full transition-colors"
          >
            Explore TaleCraft Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
