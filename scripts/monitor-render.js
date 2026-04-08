#!/usr/bin/env node
// Auto-monitor Render deployment

const SERVICE_URL = 'https://ultra-dex.onrender.com';
const CHECK_INTERVAL = 30000; // 30 seconds

console.log('🔍 Auto-monitoring Ultra-Dex deployment...\n');

async function checkHealth() {
  const timestamp = new Date().toLocaleTimeString();
  
  try {
    const response = await fetch(`${SERVICE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ [${timestamp}] DEPLOYMENT LIVE!`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Version: ${data.version}`);
      console.log(`   Uptime: ${Math.floor(data.uptime)}s`);
      console.log(`\n🎉 SUCCESS! Your app is running at:`);
      console.log(`   ${SERVICE_URL}`);
      console.log(`\n📊 Test these URLs:`);
      console.log(`   ${SERVICE_URL}/health`);
      console.log(`   ${SERVICE_URL}/api/status`);
      process.exit(0);
    } else {
      console.log(`⏳ [${timestamp}] Starting up... (status: ${response.status})`);
    }
  } catch (error) {
    console.log(`⏳ [${timestamp}] Still building... (${error.message})`);
  }
}

// Check immediately, then every 30 seconds
checkHealth();
setInterval(checkHealth, CHECK_INTERVAL);

console.log(`Checking every ${CHECK_INTERVAL/1000}s... Press Ctrl+C to stop\n`);
