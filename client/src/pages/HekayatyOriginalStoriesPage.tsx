import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import { Link } from "wouter";
import fantasyBackground from "@/assets/571601e5-d155-4362-b446-db1c4302f71c.png";

export default function HekayatyOriginalStoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: stories, isLoading } = useQuery({
    queryKey: ["/stories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/stories?is_published=true");
      const data = await res.json();
      console.log('Stories response:', data);
      // Ensure data is an array and filter out any invalid entries
      return Array.isArray(data) ? data.filter(story => story && story.id) : [];
    },
  });

  const filteredStories = stories?.filter((story: any) =>
    story && story.title && (
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.description && story.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  ) || [];

  return (
    <>
      <Helmet>
        <title>Hekayaty Original Stories</title>
        <meta
          name="description"
          content="Explore exclusive Hekayaty Original stories crafted by our community's finest authors."
        />
      </Helmet>

      <div
          className="bg-cover bg-center bg-fixed bg-gradient-to-b from-purple-900/40 to-amber-900/30 min-h-screen pt-8 pb-16"
          style={{ backgroundImage: `url(${fantasyBackground})` }}
        >
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-cinzel text-4xl font-bold text-white mb-4">
              Hekayaty Original Stories
            </h1>
            <p className="text-white max-w-2xl mx-auto mb-6">
              Explore exclusive stories crafted by our community's finest authors
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-amber-500/50 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Stories Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-amber-200 h-48 rounded-t-lg mb-4"></div>
                  <div className="bg-amber-200 h-4 rounded mb-2"></div>
                  <div className="bg-amber-200 h-3 rounded mb-2"></div>
                  <div className="bg-amber-200 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStories.map((story: any) => (
                <Link key={story.id} href={`/story/${story.id}`}>
                  <div className="story-card bg-amber-50 bg-opacity-10 backdrop-filter backdrop-blur-sm rounded-lg overflow-hidden border border-amber-500 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    {/* Story Cover Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={story.cover_url || story.poster_url || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brown-dark/60 to-transparent" />
                      
                      {/* Genre Badge */}
                      {story.genre && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-amber-500/90 text-amber-50 text-xs font-medium px-2 py-1 rounded-full">
                            {story.genre}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Card Content */}
                    <div className="p-4">
                      <h3 className="font-cinzel text-lg font-bold mb-2 text-amber-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                        {story.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-amber-50/80 text-sm leading-relaxed line-clamp-3 mb-3">
                        {story.description || story.synopsis}
                      </p>

                      {/* Date */}
                      {story.created_at && (
                        <div className="text-amber-200/60 text-xs">
                          {new Date(story.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-cinzel font-bold text-white mb-2">
                {searchQuery ? "No stories found" : "No stories yet"}
              </h3>
              <p className="text-amber-200">
                {searchQuery 
                  ? "Try adjusting your search terms" 
                  : "Be the first to publish a Hekayaty Original story!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
