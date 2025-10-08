-- Add YouTube URL support to stories table
-- This allows authors to add YouTube videos (trailers, readings, etc.) to their stories

ALTER TABLE stories 
ADD COLUMN youtube_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN stories.youtube_url IS 'YouTube video URL for story trailer, reading, or related content';

-- Optional: Add constraint to ensure valid YouTube URLs (can be added later)
-- ALTER TABLE stories 
-- ADD CONSTRAINT valid_youtube_url 
-- CHECK (youtube_url IS NULL OR youtube_url ~ '^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[a-zA-Z0-9_-]+');
