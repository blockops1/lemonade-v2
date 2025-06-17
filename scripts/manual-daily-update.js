#!/usr/bin/env node

import { config } from 'dotenv';
import { resolve } from 'path';
import fetch from 'node-fetch';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function manualDailyUpdate() {
  try {
    console.log('🚀 Starting manual daily update...');
    
    // Get the deployment URL from environment or use localhost
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    console.log('Using base URL:', baseUrl);
    
    // First, check the debug info
    console.log('\n📊 Checking system status...');
    const debugResponse = await fetch(`${baseUrl}/api/daily-winners`, {
      method: 'PATCH'
    });
    
    if (debugResponse.ok) {
      const debugInfo = await debugResponse.json();
      console.log('System status:', JSON.stringify(debugInfo, null, 2));
    } else {
      console.log('Debug endpoint failed:', debugResponse.status);
    }
    
    // Trigger the manual update
    console.log('\n🔄 Triggering manual daily update...');
    const updateResponse = await fetch(`${baseUrl}/api/daily-winners?key=lemonade2024`, {
      method: 'PUT'
    });

    console.log('Update response status:', updateResponse.status);
    
    const updateData = await updateResponse.json();
    console.log('Update response:', JSON.stringify(updateData, null, 2));

    if (updateResponse.ok) {
      console.log('\n✅ Manual daily update completed successfully!');
      console.log(`📅 Winners count: ${updateData.winnersCount}`);
      console.log(`⏰ Timestamp: ${updateData.timestamp}`);
    } else {
      console.log('\n❌ Manual daily update failed!');
      console.log('Error:', updateData.error);
    }

  } catch (error) {
    console.error('❌ Error during manual daily update:', error);
    process.exit(1);
  }
}

manualDailyUpdate(); 