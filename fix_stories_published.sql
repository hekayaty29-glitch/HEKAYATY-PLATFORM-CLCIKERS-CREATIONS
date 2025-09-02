-- Update all existing stories to be published
UPDATE public.stories 
SET is_published = true 
WHERE is_published IS NULL OR is_published = false;

-- Verify the update
SELECT id, title, is_published, created_at 
FROM public.stories 
ORDER BY created_at DESC;
