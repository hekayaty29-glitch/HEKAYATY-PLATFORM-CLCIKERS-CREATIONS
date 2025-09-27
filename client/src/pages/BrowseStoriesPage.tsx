import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import StoryCard from "@/components/story/StoryCard";
import { StoryCard as StoryCardType, Genre } from "@/lib/types";
import ComicCard from "@/components/comic/ComicCard";
import { Search, SlidersHorizontal, FilterX, BookOpen, Award, Bookmark, AlertTriangle } from "lucide-react";
import Container from "@/components/layout/Container";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function BrowseStoriesPage() {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [pageTitle, setPageTitle] = useState("Browse Stories");
  const [pageDescription, setPageDescription] = useState("Discover fascinating stories from talented authors");
  const { isAuthenticated } = useAuth();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [storyType, setStoryType] = useState<string>("all");
  
  // Determine page mode (all stories, top-rated, or bookmarks)
  const isTopRated = location.includes("/top-rated");
  const isBookmarks = location.includes("/bookmarks");
  
  // Fetch genres and ensure "Historical" is available
  const { data: fetchedGenres } = useQuery<Genre[]>({
    queryKey: ["/genres"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add local fallback genre if it's missing
  const genres: Genre[] = (fetchedGenres ?? []).some((g) => g.name.toLowerCase() === "historical")
    ? fetchedGenres ?? []
    : [...(fetchedGenres ?? []), { id: 999, name: "Historical", description: "Historical fiction", icon: "🏰" }];

  // Fetch stories based on page mode
  const { data: stories, isLoading, error: storiesError } = useQuery<StoryCardType[]>({
    queryKey: [
      isTopRated 
        ? "/api/stories/top-rated" 
        : isBookmarks 
          ? "/api/bookmarks" 
          : "/stories"
    ],
    queryFn: async () => {
      try {
        console.log('Fetching stories...');
        if (isTopRated) {
          // For top-rated, we might need a different endpoint
          const res = await apiRequest("GET", "/stories?is_published=true&sort=rating");
          const data = await res.json();
          console.log('Top-rated stories response:', data);
          return Array.isArray(data) ? data.filter(story => story && story.id) : [];
        } else if (isBookmarks) {
          // For bookmarks, we need user-specific data
          const res = await apiRequest("GET", "/api/bookmarks");
          const data = await res.json();
          console.log('Bookmarks response:', data);
          return Array.isArray(data) ? data.filter(story => story && story.id) : [];
        } else {
          // For all stories
          const res = await apiRequest("GET", "/stories?is_published=true");
          const data = await res.json();
          console.log('All stories response:', data);
          return Array.isArray(data) ? data.filter(story => story && story.id) : [];
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
        return [];
      }
    },
    enabled: !isBookmarks || isAuthenticated,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch comics if not bookmarks/top-rated
  const { data: comics, isLoading: isLoadingComics, error: comicsError } = useQuery<any[]>({
    queryKey: ["/comics"],
    queryFn: async () => {
      try {
        console.log('Fetching comics...');
        const res = await apiRequest("GET", "/comics");
        const data = await res.json();
        console.log('Comics response:', data);
        return Array.isArray(data) ? data.filter(comic => comic && comic.id) : [];
      } catch (error) {
        console.error('Error fetching comics:', error);
        return [];
      }
    },
    enabled: !isTopRated && !isBookmarks,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Update page title and description based on mode
  useEffect(() => {
    if (isTopRated) {
      setPageTitle("Top Rated Stories");
      setPageDescription("Explore the highest rated stories on TaleKeeper");
    } else if (isBookmarks) {
      setPageTitle("My Library");
      setPageDescription("Your collection of bookmarked stories");
    } else {
      setPageTitle("Browse Stories");
      setPageDescription("Discover fascinating stories from talented authors");
    }
  }, [isTopRated, isBookmarks]);
  
  // Filter and sort stories
  const filteredStories = stories?.filter(story => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        story.title.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query) ||
        story.author?.fullName.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Apply genre filter
    if (selectedGenres.length > 0) {
      const storyGenreIds = story.genres.map(g => g.id);
      const hasSelectedGenre = selectedGenres.some(id => storyGenreIds.includes(id));
      if (!hasSelectedGenre) return false;
    }
    
    // Apply story type filter
    if (storyType === "novels" && story.isShortStory) return false;
    if (storyType === "short-stories" && !story.isShortStory) return false;
    
    return true;
  }) || [];
  
  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "rating":
        return b.averageRating - a.averageRating;
      default:
        return 0;
    }
  });
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setSelectedGenres([]);
    setStoryType("all");
  };
  
  // Handle genre selection
  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };
  
  return (
    <>
      <Helmet>
        <title>{pageTitle} - TaleKeeper</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      
      <div className="pt-4 sm:pt-6 lg:pt-8 pb-12 sm:pb-16" style={{ backgroundColor: '#151008' }}>
        <Container>
          <div className="flex flex-col lg:flex-row justify-between items-center mb-6 sm:mb-8">
            <div className="text-center lg:text-left">
              <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{pageTitle}</h1>
              <p className="text-white/90 mt-2 text-sm sm:text-base">{pageDescription}</p>
            </div>
          </div>
          
          {/* Filters */}
          <Card className="border-amber-500/30 bg-amber-50/80 mb-6 sm:mb-8">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                <div className="relative flex-grow">
                  <Input
                    placeholder="Search stories, authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 border-amber-500/50 focus:border-amber-500 text-sm sm:text-base"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-amber-500/50 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-manipulation">
                        <BookOpen className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">{storyType === "all" ? "All Types" : storyType === "novels" ? "Novels" : "Short Stories"}</span>
                        <span className="sm:hidden">{storyType === "all" ? "All" : storyType === "novels" ? "Novels" : "Short"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-brown-dark/95 border-brown-dark/50 text-white">
                      <DropdownMenuLabel className="text-white">Story Type</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-brown-dark/50" />
                        <DropdownMenuCheckboxItem
                          className="hover:bg-brown-dark/20 focus:bg-brown-dark/20"
                          checked={storyType === "all"}
                          onCheckedChange={() => setStoryType("all")}
                        >
                        All Types
                      </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          className="hover:bg-brown-dark/20 focus:bg-brown-dark/20"
                          checked={storyType === "novels"}
                          onCheckedChange={() => setStoryType("novels")}
                        >
                        Novels
                      </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          className="hover:bg-brown-dark/20 focus:bg-brown-dark/20"
                          checked={storyType === "short-stories"}
                          onCheckedChange={() => setStoryType("short-stories")}
                        >
                        Short Stories
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-amber-500/50 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-manipulation">
                        <SlidersHorizontal className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Genres</span>
                        <span className="sm:hidden">Genre</span>
                        {selectedGenres.length > 0 && ` (${selectedGenres.length})`}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-brown-dark/95 border-amber-500/50 text-white">
                      <DropdownMenuLabel className="text-white">Select Genres</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {genres.map(genre => (
                        <DropdownMenuCheckboxItem
                          key={genre.id}
                          className="hover:bg-amber-500/20 focus:bg-amber-500/20"
                          checked={selectedGenres.includes(genre.id)}
                          onCheckedChange={() => toggleGenre(genre.id)}
                        >
                          {genre.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Select
                    value={sortBy}
                    onValueChange={setSortBy}
                  >
                    <SelectTrigger className="w-[120px] sm:w-[160px] lg:w-[180px] border-amber-500/50 focus:border-amber-500 text-xs sm:text-sm touch-manipulation">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="bg-brown-dark/95 border-amber-500/50 text-white">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-amber-200 p-2 touch-manipulation"
                    onClick={resetFilters}
                  >
                    <FilterX className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stories */}
          {storiesError && (
            <div className="text-center py-8 bg-red-50/10 rounded-lg border border-red-500/20 mx-3 sm:mx-0 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-cinzel text-lg text-white mb-2">Error Loading Stories</h3>
              <p className="text-white/80 text-sm">
                {storiesError.message || "Failed to load stories. Please try refreshing the page."}
              </p>
            </div>
          )}
          
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg h-64 sm:h-72 lg:h-80"></div>
              ))}
            </div>
          ) : sortedStories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {sortedStories.map(story => (
                <StoryCard 
                  key={story.id} 
                  story={story} 
                  isBookmarked={isBookmarks}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 bg-amber-50/10 rounded-lg border border-amber-500/20 mx-3 sm:mx-0">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="font-cinzel text-lg sm:text-xl text-white mb-2">
                {isBookmarks ? "Your Library is Empty" : "No Stories Found"}
              </h3>
              <p className="text-white/80 max-w-md mx-auto text-sm sm:text-base px-4">
                {isBookmarks 
                  ? "You haven't bookmarked any stories yet. Start exploring to add stories to your library."
                  : searchQuery || selectedGenres.length > 0 || storyType !== "all"
                    ? "No stories match your filters. Try adjusting your search criteria."
                    : "There are no stories available at the moment. Please check back later."}
              </p>
              
              {isBookmarks && (
                <Button asChild className="mt-4 sm:mt-6 bg-amber-500 hover:bg-amber-600 touch-manipulation">
                  <a href="/stories">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Stories
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Comics section */}
          {!isTopRated && !isBookmarks && (
            <>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white mt-12 sm:mt-16 mb-4 sm:mb-6">Comics</h2>
              {isLoadingComics ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-lg h-64 sm:h-72 lg:h-80"></div>
                  ))}
                </div>
              ) : comics && comics.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                  {comics.map((comic) => (
                    <ComicCard key={comic.id} comic={{ id: comic.id, title: comic.title, cover: comic.cover_image || comic.pdf_url }} />
                  ))}
                </div>
              ) : (
                <p className="text-white/80 text-center text-sm sm:text-base">No comics found.</p>
              )}
            </>
          )}
        </Container>
      </div>
    </>
  );
}
