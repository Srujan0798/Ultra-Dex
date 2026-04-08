#!/usr/bin/env node
/**
 * Professional Health Checker
 * Runs continuously and reports to monitoring services
 */

const CONFIG = require('./config.json');
const SERVICE_URL = CONFIG.service.url;

// Results storage
const results = [];
const MAX_RESULTS = 1000;

async function checkEndpoint(endpoint) {
  const startTime = Date.now();
  const url = `${SERVICE_URL}${endpoint.path}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });
    
    const latency = Date.now() - startTime;
    const success = response.ok;
    
    const result = {
      endpoint: endpoint.name,
      url,
      status: response.status,
      success,
      latency,
      timestamp: new Date().toISOString(),
      critical: endpoint.critical
    };
    
    results.push(result);
    if (results.length > MAX_RESULTS) results.shift();
    
    return result;
  } catch (error) {
    const result = {
      endpoint: endpoint.name,
      url,
      status: 0,
      success: false,
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      critical: endpoint.critical,
      error: error.message
    };
    
    results.push(result);
    if (results.length > MAX_RESULTS) results.shift();
    
    return result;
  }
}

async function checkAll() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n[${timestamp}] Running health checks...`);
  
  const checks = await Promise.all(
    CONFIG.endpoints.map(e => checkEndpoint(e))
  );
  
  // Display results
  let hasFailure = false;
  checks.forEach(check => {
    const icon = check.success ? '✅' : '❌';
    const critical = check.critical ? '[CRITICAL]' : '';
    console.log(`${icon} ${check.endpoint}: ${check.status} (${check.latency}ms) ${critical}`);
    
    if (!check.success && check.critical) {
      hasFailure = true;
    }
  });
  
  // Alert on failure
  if (hasFailure) {
    await sendAlert(checks);
  }
  
  return checks;
}

async function sendAlert(checks) {
  const failed = checks.filter(c => !c.success && c.critical);
  
  const message = {
    text: `🚨 ALERT: Ultra-Dex Service Down`,
    details: failed.map(f => `- ${f.endpoint}: ${f.error || 'HTTP ' + f.status}`).join('\n'),
    timestamp: new Date().toISOString()
  };
  
  console.log('\n⚠️  ALERT:', message.text);
  console.log(message.details);
  
  // Send to Slack if configured
  if (CONFIG.alerts.slack_webhook) {
    try {
      await fetch(CONFIG.alerts.slack_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.text + '\n' + message.details })
      });
    } catch (e) {
      console.log('Failed to send Slack alert:', e.message);
    }
  }
}

function generateReport() {
  const last24h = results.filter(r => 
    new Date(r.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  
  const uptime = last24h.filter(r => r.success).length / last24h.length * 100;
  const avgLatency = last24h.reduce((sum, r) => sum + r.latency, 0) / last24h.length;
  
  return {
    uptime: uptime.toFixed(2) + '%',
    avgLatency: Math.round(avgLatency) + 'ms',
    totalChecks: last24h.length,
    failures: last24h.filter(r => !r.success).length
  };
}

// Web server for status dashboard
const http = require('http');
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/status') {
    res.end(JSON.stringify({
      service: CONFIG.service.name,
      report: generateReport(),
      lastCheck: results[results.length - 1],
      timestamp: new Date().toISOString()
    }, null, 2));
  } else {
    res.end(JSON.stringify({ status: 'monitoring active' }));
  }
});

// Main loop
console.log('🔍 Starting professional health monitor...');
console.log(`   Service: ${SERVICE_URL}`);
console.log(`   Check interval: ${CONFIG.service.check_interval}s`);
console.log('');

// Check immediately, then every interval
checkAll();
setInterval(checkAll, CONFIG.service.check_interval * 1000);

// Start status server
const PORT = process.env.MONITOR_PORT || 9090;
server.listen(PORT, () => {
  console.log(`📊 Status dashboard: http://localhost:${PORT}/status`);
});

module.exports = { checkAll, generateReport };
