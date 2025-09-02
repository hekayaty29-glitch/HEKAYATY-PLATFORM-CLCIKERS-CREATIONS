-- Test query to check what stories exist and their status
SELECT 
    id,
    title,
    author_id,
    is_published,
    created_at,
    updated_at
FROM public.stories 
ORDER BY created_at DESC
LIMIT 10;

-- Count total stories by publication status
SELECT 
    is_published,
    COUNT(*) as count
FROM public.stories 
GROUP BY is_published;

-- Check if stories table has the expected columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'stories' 
AND table_schema = 'public'
ORDER BY ordinal_position;
