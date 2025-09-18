-- Add profile_name and story_title columns to ratings table
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS profile_name TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS story_title TEXT;

-- Update existing ratings with profile names and story titles
UPDATE ratings 
SET profile_name = profiles.full_name 
FROM profiles 
WHERE ratings.user_id = profiles.id 
AND ratings.profile_name IS NULL;

UPDATE ratings 
SET story_title = stories.title 
FROM stories 
WHERE ratings.story_id = stories.id 
AND ratings.story_title IS NULL;

-- Set defaults for any remaining null values
UPDATE ratings 
SET profile_name = 'Anonymous User' 
WHERE profile_name IS NULL;

UPDATE ratings 
SET story_title = 'Unknown Story' 
WHERE story_title IS NULL;
