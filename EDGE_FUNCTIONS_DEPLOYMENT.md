# Edge Functions Deployment Guide

## Project Details
- **Project ID**: `wqjymqhfzuejrlcfmxcu`
- **Database Password**: `GbqD6waXHYPAkcvW`

## Quick Deployment

### Option 1: Run the Batch Script
```bash
./deploy-edge-functions.bat
```

### Option 2: Manual Commands
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref wqjymqhfzuejrlcfmxcu

# 4. Deploy all functions at once
supabase functions deploy
```

## Individual Function Deployment
If you prefer to deploy functions individually:

```bash
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
```

## Environment Variables Required
Make sure these are set in your Supabase project dashboard:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Verification
After deployment, test the functions at:
`https://wqjymqhfzuejrlcfmxcu.supabase.co/functions/v1/[function-name]`

## Complete Function List
✅ **22 Edge Functions Ready for Deployment:**

1. **admin** - Admin dashboard and user management
2. **analytics** - Analytics and metrics (admin only)
3. **auth** - Authentication (register, login, logout)
4. **bookmarks** - Bookmark management
5. **chapters** - Chapter CRUD operations
6. **characters** - Character management
7. **comics** - Comic listing and creation
8. **community** - Workshops and community features
9. **creators** - Creator listings and top creators
10. **featured** - Featured content management
11. **genres** - Genre listing and creation
12. **hall-of-quills** - Leaderboards and competitions
13. **notifications** - User notifications
14. **profiles** - User profiles and settings
15. **projects** - TaleCraft projects management
16. **ratings** - Story ratings and reviews
17. **search** - Search across stories/comics/users
18. **security** - Security monitoring (admin only)
19. **send-vip-email** - VIP email sending
20. **stories** - Story CRUD operations
21. **subscriptions** - VIP subscription management
22. **upload** - File upload to Cloudinary
