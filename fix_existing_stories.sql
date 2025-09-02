-- Fix existing stories to make them visible on the website
-- This script updates all existing stories to be published

-- Update all existing stories to be published
UPDATE public.stories 
SET 
    is_published = true,
    published_at = COALESCE(published_at, created_at, NOW())
WHERE is_published IS NULL OR is_published = false;

-- Verify the update
SELECT 
    COUNT(*) as total_stories,
    COUNT(CASE WHEN is_published = true THEN 1 END) as published_stories,
    COUNT(CASE WHEN is_published = false OR is_published IS NULL THEN 1 END) as unpublished_stories
FROM public.stories;

-- Show sample of updated stories
SELECT 
    id, 
    title, 
    is_published, 
    published_at,
    created_at
FROM public.stories 
ORDER BY created_at DESC 
LIMIT 10;
