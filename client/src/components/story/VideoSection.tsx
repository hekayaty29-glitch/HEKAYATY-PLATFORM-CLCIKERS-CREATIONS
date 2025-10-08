import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube';

interface VideoSectionProps {
  youtubeUrl?: string | null;
  storyTitle: string;
}

export default function VideoSection({ youtubeUrl, storyTitle }: VideoSectionProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  
  if (!youtubeUrl) return null;
  
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) return null;
  
  const thumbnailUrl = getYouTubeThumbnail(videoId, 'high');
  const embedUrl = getYouTubeEmbedUrl(videoId);
  
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-lg p-6 border border-amber-500/20">
        <h3 className="font-cinzel text-xl font-bold text-amber-50 mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-amber-500" />
          Story Video
        </h3>
        
        {!isVideoOpen ? (
          // Video Thumbnail with Play Button
          <div className="relative group cursor-pointer" onClick={() => setIsVideoOpen(true)}>
            <img
              src={thumbnailUrl}
              alt={`Video for ${storyTitle}`}
              className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/20 transition-colors">
              <div className="bg-amber-500 hover:bg-amber-400 rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-brown-dark fill-current ml-1" />
              </div>
            </div>
            
            {/* Video Info */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                <p className="text-amber-50 font-medium text-sm">
                  Click to watch story video
                </p>
              </div>
            </div>
          </div>
        ) : (
          // YouTube Embed
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setIsVideoOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="relative w-full h-64 sm:h-80 lg:h-96">
              <iframe
                src={embedUrl}
                title={`Video for ${storyTitle}`}
                className="absolute inset-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
        
        <p className="text-amber-200 text-sm mt-3 italic">
          Enhance your reading experience with this story video
        </p>
      </div>
    </div>
  );
}
