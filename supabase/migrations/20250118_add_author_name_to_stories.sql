-- Add author_name column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Update existing stories with author names from profiles
UPDATE stories 
SET author_name = profiles.full_name 
FROM profiles 
WHERE stories.author_id = profiles.id 
AND stories.author_name IS NULL;

-- Set default for stories without profiles
UPDATE stories 
SET author_name = 'Unknown Author' 
WHERE author_name IS NULL;
