import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Genre } from "@/lib/types";

export default function HeroSection() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: genres } = useQuery<Genre[]>({
    queryKey: ["/genres"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <section className="hero-section text-amber-50 py-16 sm:py-24 md:py-32 lg:py-36 xl:py-40 px-3 sm:px-4">
      <div className="container mx-auto max-w-5xl text-center">
        <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-shadow leading-tight">
          Enter the Realm of <span className="text-amber-500">Tales</span>
        </h1>
        <p className="font-cormorant text-base sm:text-lg md:text-xl lg:text-2xl italic mb-6 sm:mb-8 max-w-3xl mx-auto text-shadow-sm leading-relaxed">
          Embark on epic journeys through enchanted castles and mystical kingdoms crafted by passionate storytellers.
        </p>
        
        <div className="backdrop-blur-sm bg-black/30 p-4 sm:p-6 rounded-lg shadow-lg max-w-4xl mx-auto mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <form onSubmit={handleSearch} className="relative w-full sm:w-2/3">
              <Input
                type="text"
                placeholder="Search stories, authors, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 sm:py-5 lg:py-6 px-4 sm:px-5 bg-opacity-20 bg-amber-50 text-amber-50 placeholder-amber-50 placeholder-opacity-70 border border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full text-sm sm:text-base"
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon" 
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-amber-500 hover:text-amber-300 transition-colors h-8 w-8 sm:h-10 sm:w-10"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </form>
            
            <Button 
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-white font-cinzel py-4 sm:py-5 lg:py-6 px-6 sm:px-8 rounded-full text-sm sm:text-base font-medium touch-manipulation"
            >
              <Link href="/originals">Start Reading</Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {genres?.slice(0, 6).map((genre) => (
              <Link key={genre.id} href={`/genres/${genre.id}`} className="genre-badge text-xs sm:text-sm font-cinzel py-2 px-3 sm:px-4 rounded-full cursor-pointer touch-manipulation transition-transform hover:scale-105 active:scale-95">
                {genre.name}
              </Link>
            ))}
            {genres && genres.length > 6 && (
              <Link href="/genres" className="genre-badge text-xs sm:text-sm font-cinzel py-2 px-3 sm:px-4 rounded-full cursor-pointer touch-manipulation transition-transform hover:scale-105 active:scale-95">
                +{genres.length - 6} more
              </Link>
            )}
          </div>
        </div>
        
        <div className="mt-8 sm:mt-12 flex justify-center">
          <Button 
            asChild
            className="bg-amber-800/80 hover:bg-amber-800 text-amber-50 font-cinzel py-3 sm:py-4 px-6 sm:px-8 rounded-lg border border-amber-500/50 hover:border-amber-500 text-sm sm:text-base touch-manipulation transition-all hover:scale-105 active:scale-95"
          >
            <Link href="/register?premium=true">Premium Adventure Awaits</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
