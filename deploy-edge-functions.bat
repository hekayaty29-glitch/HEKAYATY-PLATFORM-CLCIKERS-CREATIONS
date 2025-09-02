@echo off
echo Installing Supabase CLI...
npm install -g supabase

echo Logging into Supabase...
supabase login

echo Linking to your project...
supabase link --project-ref wqjymqhfzuejrlcfmxcu

echo Deploying all Edge Functions...
supabase functions deploy admin
supabase functions deploy analytics
supabase functions deploy auth
supabase functions deploy bookmarks
supabase functions deploy chapters
supabase functions deploy characters
supabase functions deploy comics
supabase functions deploy community
supabase functions deploy creators
supabase functions deploy featured
supabase functions deploy genres
supabase functions deploy hall-of-quills
supabase functions deploy notifications
supabase functions deploy profiles
supabase functions deploy projects
supabase functions deploy ratings
supabase functions deploy search
supabase functions deploy security
supabase functions deploy send-vip-email
supabase functions deploy stories
supabase functions deploy subscriptions
supabase functions deploy upload

echo All Edge Functions deployed successfully!
pause
