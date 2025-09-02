#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Hekayaty Platform to Serverless Architecture...\n');

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'ignore' });
  console.log('✅ Supabase CLI found');
} catch (error) {
  console.log('❌ Supabase CLI not found. Installing...');
  execSync('npm install -g supabase', { stdio: 'inherit' });
}

// Check if user is logged in
try {
  execSync('supabase projects list', { stdio: 'ignore' });
  console.log('✅ Supabase authentication verified');
} catch (error) {
  console.log('❌ Please login to Supabase first:');
  console.log('   supabase login');
  process.exit(1);
}

// Deploy all Edge Functions
console.log('\n📦 Deploying Edge Functions...');
try {
  execSync('supabase functions deploy', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ All Edge Functions deployed successfully!');
} catch (error) {
  console.log('❌ Deployment failed. Please check your configuration.');
  process.exit(1);
}

console.log('\n🎉 Serverless deployment complete!');
console.log('\n📋 Next steps:');
console.log('1. Set environment variables in Supabase Dashboard');
console.log('2. Update your frontend .env with Supabase URLs');
console.log('3. Test your new serverless endpoints');
console.log('\n🌟 Your platform is now fully serverless!');
