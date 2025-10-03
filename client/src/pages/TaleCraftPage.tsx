import { Link } from "wouter";
import { useState } from "react";
import TaleCraftEditorPage from "./TaleCraftEditorPage";
import { Helmet } from "react-helmet";
import { Hammer } from "lucide-react";

interface WorkshopStory {
  id: number;
  title: string;
  author: string;
  summary: string;
  cover: string; // story cover image URL
  emoji?: string; // fallback emoji if no image
}

const workshopStories: WorkshopStory[] = [
  {
    id: 301,
    title: "Forged in Starlight",
    author: "Eira Stormforge",
    summary:
      "Crafted during the Celestial Smithing workshop, this tale follows a blacksmith who forges weapons from fallen stars.",
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&crop=center",
    emoji: "✨",
  },
  {
    id: 302,
    title: "The Whispering Quill",
    author: "Rowan Inkweaver",
    summary:
      "A sentient quill guides a scribe through a maze of magical parchment. Born in the Art of Quills workshop.",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&crop=center",
    emoji: "🖋️",
  },
  {
    id: 303,
    title: "Chronicles of the Clockwork Garden",
    author: "Thalia Gearheart",
    summary:
      "From the Mechanized Worlds workshop—discover a garden where flowers tick and vines chime.",
    cover: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=center",
    emoji: "⏰",
  },
];

export default function TaleCraftPage() {
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  
  return (
    <>
      {view === "dashboard" && (
        <>
          <Helmet>
            <title>TaleCraft Workshops</title>
            <meta
              name="description"
              content="Explore standout stories produced in the TaleCraft community workshops."
            />
          </Helmet>

          <section className="py-20 px-4 bg-gradient-to-br from-amber-800 via-brown-dark to-midnight-blue text-amber-50">
            <div className="container mx-auto max-w-6xl text-center">
              <div className="flex justify-center items-center gap-4 mb-6">
                <Hammer className="h-8 w-8 text-amber-400" />
                <h1 className="font-cinzel text-4xl md:text-5xl font-bold">TaleCraft Workshops</h1>
                <Hammer className="h-8 w-8 text-amber-400" />
              </div>
              <button
                onClick={() => setView("editor")}
                className="inline-block mb-6 bg-emerald-600 hover:bg-emerald-700 text-white font-cinzel text-sm py-2 px-6 rounded-full transition-colors"
              >
                ✨ Create Comic
              </button>

              <p className="max-w-3xl mx-auto text-amber-200 mb-12 text-lg font-cormorant italic">
                Masterpieces forged in the fires of collaboration. Dive into stories refined within our community workshops.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {workshopStories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/story/${story.id}`}
                    className="story-card bg-amber-50/10 rounded-lg border border-amber-500 backdrop-filter backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col overflow-hidden group touch-manipulation"
                  >
                    {/* Story Cover Image */}
                    <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
                      <img
                        src={story.cover}
                        alt={`Cover for ${story.title}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      {/* Emoji Fallback */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-amber-800/50 to-amber-900/50 flex items-center justify-center text-6xl hidden"
                        style={{ display: 'none' }}
                      >
                        {story.emoji}
                      </div>
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Story Content */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col">
                      <h3 className="font-cinzel text-lg sm:text-xl md:text-2xl font-bold text-amber-100 mb-2 group-hover:text-amber-300 transition-colors line-clamp-2">
                        {story.title}
                      </h3>
                      <p className="text-amber-200 text-xs sm:text-sm mb-3 font-medium">by {story.author}</p>
                      <p className="text-amber-50/90 text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
                        {story.summary}
                      </p>
                      
                      {/* Read Button */}
                      <div className="mt-auto">
                        <span className="inline-block bg-amber-500 group-hover:bg-amber-400 text-amber-50 font-cinzel text-sm py-2 px-4 sm:px-6 rounded-full transition-colors">
                          Read Story →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      {view === "editor" && (
        <div className="min-h-screen bg-slate-900">
          <TaleCraftEditorPage />
        </div>
      )}
    </>
  );
}
