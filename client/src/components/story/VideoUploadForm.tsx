import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Youtube, Save, X, AlertCircle } from 'lucide-react';
import { isValidYouTubeUrl, normalizeYouTubeUrl, extractYouTubeVideoId, getYouTubeThumbnail } from '@/lib/youtube';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';

interface VideoUploadFormProps {
  storyId: string;
  currentVideoUrl?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VideoUploadForm({ 
  storyId, 
  currentVideoUrl, 
  onClose, 
  onSuccess 
}: VideoUploadFormProps) {
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl || '');
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(
    currentVideoUrl ? extractYouTubeVideoId(currentVideoUrl) : null
  );
  const [error, setError] = useState('');
  
  const queryClient = useQueryClient();
  
  const updateVideoMutation = useMutation({
    mutationFn: async (url: string) => {
      const normalizedUrl = url ? normalizeYouTubeUrl(url) : null;
      
      const response = await apiRequest('PATCH', `/stories/${storyId}`, {
        youtube_url: normalizedUrl
      });
      
      if (!response.ok) {
        throw new Error('Failed to update video URL');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Story video updated successfully!');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update video: ' + error.message);
    }
  });
  
  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    setError('');
    
    if (url.trim()) {
      if (isValidYouTubeUrl(url)) {
        const videoId = extractYouTubeVideoId(url);
        setPreviewVideoId(videoId);
      } else {
        setError('Please enter a valid YouTube URL');
        setPreviewVideoId(null);
      }
    } else {
      setPreviewVideoId(null);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (videoUrl.trim() && !isValidYouTubeUrl(videoUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    
    updateVideoMutation.mutate(videoUrl.trim());
  };
  
  const handleRemoveVideo = () => {
    updateVideoMutation.mutate('');
  };
  
  return (
    <div className="bg-gradient-to-br from-amber-50/5 to-amber-100/10 rounded-lg p-6 border border-amber-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel text-lg font-bold text-amber-50 flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          Add Story Video
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="video-url" className="text-amber-200 mb-2 block">
            YouTube Video URL
          </Label>
          <Input
            id="video-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="bg-amber-50/10 border-amber-500/30 text-amber-50 placeholder-amber-300/50"
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
        
        {/* Video Preview */}
        {previewVideoId && (
          <div className="mt-4">
            <Label className="text-amber-200 mb-2 block">Preview</Label>
            <div className="relative">
              <img
                src={getYouTubeThumbnail(previewVideoId, 'medium')}
                alt="Video preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <div className="bg-red-600 rounded-full p-2">
                  <Youtube className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={updateVideoMutation.isPending || (videoUrl.trim() && !previewVideoId)}
            className="bg-amber-500 hover:bg-amber-600 text-brown-dark flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateVideoMutation.isPending ? 'Saving...' : 'Save Video'}
          </Button>
          
          {currentVideoUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveVideo}
              disabled={updateVideoMutation.isPending}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Remove
            </Button>
          )}
        </div>
      </form>
      
      <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
        <p className="text-amber-200 text-sm">
          <strong>Tip:</strong> Add a story trailer, author reading, or behind-the-scenes video to enhance your readers' experience.
        </p>
      </div>
    </div>
  );
}
