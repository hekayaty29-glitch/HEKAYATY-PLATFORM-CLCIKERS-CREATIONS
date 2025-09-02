# 🚀 Serverless Deployment Guide

## Quick Start Commands

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy all Edge Functions
supabase functions deploy

# 5. Set environment variables in Supabase Dashboard
```

## 🔧 Environment Variables Setup

Go to your Supabase Dashboard → Settings → Edge Functions → Environment Variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_key
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_secret
```

## 📱 Frontend Environment (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🎯 Edge Function Endpoints

Your new serverless API endpoints:
- `https://your-project.supabase.co/functions/v1/auth`
- `https://your-project.supabase.co/functions/v1/stories`
- `https://your-project.supabase.co/functions/v1/upload`
- `https://your-project.supabase.co/functions/v1/admin`

## ✅ Migration Benefits

- **Zero server maintenance**
- **Automatic scaling**
- **Global edge deployment**
- **Built-in security**
- **Cost-effective pay-per-use**

Your platform is now fully serverless! 🎉
