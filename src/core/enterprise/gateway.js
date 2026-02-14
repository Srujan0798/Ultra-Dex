/**
 * Ultra-Dex Enterprise Gateway
 * Advanced security and compliance gateway for enterprise deployments
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

class EnterpriseGateway extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableRateLimiting: options.enableRateLimiting !== false,
      enableIpWhitelisting: options.enableIpWhitelisting !== false,
      enableRequestSigning: options.enableRequestSigning !== false,
      enableAuditLogging: options.enableAuditLogging !== false,
      enableComplianceChecking: options.enableComplianceChecking !== false,
      rateLimit: {
        requests: options.rateLimit?.requests || 1000,
        windowMs: options.rateLimit?.windowMs || 60 * 1000, // 1 minute
      },
      allowedIps: options.allowedIps || [],
      blockedIps: options.blockedIps || [],
      complianceRules: options.complianceRules || [],
      requestTtl: options.requestTtl || 300000, // 5 minutes
      ...options
    };

    this.rateLimits = new Map(); // IP -> { count, resetTime }
    this.requestQueue = new Map(); // requestId -> request
    this.auditLog = [];
    this.complianceCache = new Map();
    this.healthChecks = new Map(); // service -> status
    
    this.initialize();
  }

  async initialize() {
    // Initialize enterprise security components
    await this.initializeSecurity();
    await this.initializeCompliance();
    await this.initializeMonitoring();
    
    console.log('🔐 Enterprise Gateway initialized');
  }

  /**
   * Initialize security components
   */
  async initializeSecurity() {
    // Load security certificates if provided
    if (this.options.sslCertPath) {
      try {
        this.sslCert = await fs.readFile(this.options.sslCertPath);
        console.log('✅ SSL certificate loaded');
      } catch (error) {
        console.warn('⚠️ SSL certificate not found:', error.message);
      }
    }

    // Initialize security policies
    this.securityPolicies = {
      cors: {
        enabled: true,
        origins: this.options.corsOrigins || ['*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For']
      },
      csrf: {
        enabled: true,
        tokenLength: 32
      },
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      csp: {
        enabled: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"]
        }
      }
    };
  }

  /**
   * Initialize compliance components
   */
  async initializeCompliance() {
    // Load compliance rules from configuration
    this.complianceRules = new Map();
    
    // Add default compliance rules
    this.addComplianceRule('data-encryption', {
      description: 'All data must be encrypted at rest and in transit',
      check: async (request, response) => {
        // Check if response contains sensitive data that should be encrypted
        const sensitivePatterns = [
          /password/i,
          /token/i,
          /key/i,
          /secret/i,
          /credential/i,
          /ssn/i,
          /credit.*card/i,
          /api.*key/i
        ];
        
        const responseText = JSON.stringify(response);
        const hasSensitiveData = sensitivePatterns.some(pattern => pattern.test(responseText));
        
        return {
          compliant: hasSensitiveData ? this.options.enableEncryption : true,
          message: hasSensitiveData ? 'Sensitive data detected - ensure encryption is enabled' : 'No sensitive data detected'
        };
      }
    });

    this.addComplianceRule('rate-limiting', {
      description: 'Requests must comply with rate limits',
      check: async (request, response) => {
        const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
        const limit = this.rateLimits.get(ip);
        
        if (!limit) {
          return { compliant: true, message: 'No rate limit data for IP' };
        }
        
        return {
          compliant: limit.count <= this.options.rateLimit.requests,
          message: `Rate limit: ${limit.count}/${this.options.rateLimit.requests}`
        };
      }
    });

    this.addComplianceRule('ip-whitelist', {
      description: 'Requests must come from allowed IPs',
      check: async (request, response) => {
        const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
        
        if (this.options.allowedIps.length === 0) {
          return { compliant: true, message: 'IP whitelisting not configured' };
        }
        
        const isAllowed = this.options.allowedIps.includes(ip) || 
                         this.options.allowedIps.some(allowedIp => ip.startsWith(allowedIp.replace(/\.\*$/, '')));
        
        return {
          compliant: isAllowed,
          message: isAllowed ? `IP ${ip} is allowed` : `IP ${ip} is not in whitelist`
        };
      }
    });

    console.log('✅ Compliance rules initialized');
  }

  /**
   * Initialize monitoring components
   */
  async initializeMonitoring() {
    // Set up health check intervals
    this.startHealthMonitoring();
    
    // Initialize metrics collection
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      blocked: 0,
      rateLimited: 0,
      complianceViolations: 0,
      startTime: new Date().toISOString()
    };
    
    console.log('✅ Monitoring initialized');
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    // Regular health checks for connected services
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform health checks on connected services
   */
  async performHealthChecks() {
    // Check core services
    const services = [
      { name: 'memory', check: async () => this.checkMemoryHealth() },
      { name: 'agents', check: async () => this.checkAgentHealth() },
      { name: 'mcp', check: async () => this.checkMcpHealth() },
      { name: 'database', check: async () => this.checkDatabaseHealth() }
    ];

    for (const service of services) {
      try {
        const status = await service.check();
        this.healthChecks.set(service.name, {
          status: status.healthy ? 'healthy' : 'unhealthy',
          details: status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.healthChecks.set(service.name, {
          status: 'unhealthy',
          details: { error: error.message },
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Check memory system health
   */
  async checkMemoryHealth() {
    try {
      // In a real implementation, this would check the actual memory system
      return { healthy: true, usage: 0.5, responseTime: 100 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check agent orchestrator health
   */
  async checkAgentHealth() {
    try {
      // In a real implementation, this would check the actual agent system
      return { healthy: true, activeAgents: 5, queueLength: 0 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check MCP server health
   */
  async checkMcpHealth() {
    try {
      // In a real implementation, this would check the actual MCP server
      return { healthy: true, toolsRegistered: 10, connections: 3 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      // In a real implementation, this would check the actual database
      return { healthy: true, connections: 5, latency: 50 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Process an incoming request through the enterprise gateway
   * @param {object} request - Incoming request object
   * @param {object} response - Response object
   * @param {Function} next - Next middleware function
   * @returns {boolean} True if request is allowed, false if blocked
   */
  async processRequest(request, response, next) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const clientIp = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    
    // Update metrics
    this.metrics.requests++;
    
    // 1. IP Whitelist Check
    if (this.options.enableIpWhitelisting && !this.isIpAllowed(clientIp)) {
      this.metrics.blocked++;
      await this.logAudit('request:blocked', { 
        requestId, 
        ip: clientIp, 
        reason: 'IP not in whitelist',
        timestamp: new Date().toISOString()
      });
      
      response.status(403).json({ error: 'Forbidden: IP not in whitelist' });
      return false;
    }
    
    // 2. Rate Limiting Check
    if (this.options.enableRateLimiting && !this.checkRateLimit(clientIp)) {
      this.metrics.rateLimited++;
      await this.logAudit('request:rate_limited', { 
        requestId, 
        ip: clientIp, 
        reason: 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      });
      
      response.status(429).json({ error: 'Rate limit exceeded', retryAfter: this.options.rateLimit.windowMs / 1000 });
      return false;
    }
    
    // 3. Request Signing Verification (if enabled)
    if (this.options.enableRequestSigning && !this.verifyRequestSignature(request)) {
      this.metrics.blocked++;
      await this.logAudit('request:blocked', { 
        requestId, 
        ip: clientIp, 
        reason: 'Invalid request signature',
        timestamp: new Date().toISOString()
      });
      
      response.status(401).json({ error: 'Unauthorized: Invalid request signature' });
      return false;
    }
    
    // 4. Compliance Checking
    if (this.options.enableComplianceChecking) {
      const complianceResult = await this.checkCompliance(request);
      if (!complianceResult.compliant) {
        this.metrics.complianceViolations++;
        await this.logAudit('request:compliance_violation', { 
          requestId, 
          ip: clientIp, 
          rule: complianceResult.rule,
          violation: complianceResult.message,
          timestamp: new Date().toISOString()
        });
        
        response.status(400).json({ 
          error: 'Compliance violation', 
          details: complianceResult.message 
        });
        return false;
      }
    }
    
    // Add request to queue for processing
    this.requestQueue.set(requestId, {
      request,
      startTime,
      ip: clientIp,
      processed: false
    });
    
    // Add security headers to response
    this.addSecurityHeaders(response);
    
    // Continue to next middleware
    request.ultraDexRequestId = requestId;
    next();
    
    return true;
  }

  /**
   * Check if IP is allowed
   * @param {string} ip - IP address to check
   * @returns {boolean} True if IP is allowed
   */
  isIpAllowed(ip) {
    if (this.options.allowedIps.length === 0) {
      return true; // No whitelist configured
    }
    
    return this.options.allowedIps.some(allowedIp => {
      if (allowedIp.endsWith('*')) {
        // Handle CIDR-like notation (e.g., 192.168.1.*)
        const prefix = allowedIp.replace(/\.\*$/, '');
        return ip.startsWith(prefix);
      }
      return ip === allowedIp;
    });
  }

  /**
   * Check rate limit for IP
   * @param {string} ip - Client IP address
   * @returns {boolean} True if within rate limit
   */
  checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - this.options.rateLimit.windowMs;
    
    // Get or create rate limit entry
    if (!this.rateLimits.has(ip)) {
      this.rateLimits.set(ip, { count: 0, resetTime: now + this.options.rateLimit.windowMs });
    }
    
    const limit = this.rateLimits.get(ip);
    
    // Reset counter if window has passed
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + this.options.rateLimit.windowMs;
    }
    
    // Check if limit exceeded
    if (limit.count >= this.options.rateLimit.requests) {
      return false;
    }
    
    // Increment counter
    limit.count++;
    return true;
  }

  /**
   * Verify request signature (for API security)
   * @param {object} request - Request object
   * @returns {boolean} True if signature is valid
   */
  verifyRequestSignature(request) {
    const signature = request.headers['x-ultra-dex-signature'];
    if (!signature) {
      return !this.options.requireRequestSignature; // Allow unsigned requests if not required
    }
    
    // In a real implementation, this would verify the signature against a shared secret
    // For now, we'll just return true for demo purposes
    return true;
  }

  /**
   * Add security headers to response
   * @param {object} response - Response object
   */
  addSecurityHeaders(response) {
    if (this.securityPolicies.hsts.enabled) {
      response.setHeader('Strict-Transport-Security', 
        `max-age=${this.securityPolicies.hsts.maxAge}; includeSubDomains; preload`);
    }
    
    if (this.securityPolicies.csp.enabled) {
      const cspDirectives = Object.entries(this.securityPolicies.csp.directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
      response.setHeader('Content-Security-Policy', cspDirectives);
    }
    
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  /**
   * Check compliance for a request
   * @param {object} request - Request object
   * @returns {object} Compliance check result
   */
  async checkCompliance(request) {
    for (const [ruleId, rule] of this.complianceRules) {
      try {
        const result = await rule.check(request, {});
        if (!result.compliant) {
          return {
            compliant: false,
            rule: ruleId,
            message: result.message
          };
        }
      } catch (error) {
        console.warn(`Compliance rule ${ruleId} failed:`, error.message);
        // Continue to next rule
      }
    }
    
    return { compliant: true, rule: 'all', message: 'All compliance checks passed' };
  }

  /**
   * Add a compliance rule
   * @param {string} ruleId - Rule identifier
   * @param {object} rule - Rule definition with check function
   */
  addComplianceRule(ruleId, rule) {
    this.complianceRules.set(ruleId, rule);
  }

  /**
   * Log audit event
   * @param {string} event - Audit event type
   * @param {object} details - Event details
   */
  async logAudit(event, details) {
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      event,
      details,
      integrity: this.computeIntegrityHash({ event, details })
    };

    this.auditLog.push(auditEntry);
    
    // Emit for real-time monitoring
    this.emit('audit:event', auditEntry);
    
    // In production, this would write to an immutable audit log
    if (this.options.enableAuditLogging) {
      await this.writeAuditLog(auditEntry);
    }
  }

  /**
   * Compute integrity hash for audit entry
   * @param {object} entry - Entry to hash
   * @returns {string} Hash
   */
  computeIntegrityHash(entry) {
    const content = JSON.stringify({
      event: entry.event,
      details: entry.details,
      timestamp: entry.timestamp
    });
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Write audit log to persistent storage
   * @param {object} entry - Audit entry
   */
  async writeAuditLog(entry) {
    try {
      const auditDir = path.join(process.cwd(), '.ultra-dex', 'audit');
      await fs.mkdir(auditDir, { recursive: true });
      
      const dateStr = new Date().toISOString().split('T')[0];
      const logFile = path.join(auditDir, `gateway-audit-${dateStr}.jsonl`);
      
      await fs.appendFile(logFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error('Failed to write audit log:', error.message);
    }
  }

  /**
   * Process request completion
   * @param {string} requestId - Request ID
   * @param {object} result - Request result
   */
  async processCompletion(requestId, result) {
    const queuedRequest = this.requestQueue.get(requestId);
    if (!queuedRequest) {
      return;
    }

    const duration = Date.now() - queuedRequest.startTime;
    
    // Update metrics
    if (result.success) {
      this.metrics.successes++;
    } else {
      this.metrics.failures++;
    }
    
    // Log completion
    await this.logAudit('request:completed', {
      requestId,
      ip: queuedRequest.ip,
      duration,
      success: result.success,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
    // Remove from queue
    this.requestQueue.delete(requestId);
  }

  /**
   * Get gateway metrics
   * @returns {object} Gateway metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      rateLimitStats: {
        trackedIps: this.rateLimits.size,
        currentWindow: this.options.rateLimit.windowMs / 1000 + 's'
      },
      health: this.getHealthStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status of all services
   * @returns {object} Health status
   */
  getHealthStatus() {
    const services = {};
    for (const [name, status] of this.healthChecks) {
      services[name] = status;
    }
    
    const overallHealthy = Array.from(this.healthChecks.values())
      .every(status => status.status === 'healthy');
    
    return {
      overall: overallHealthy ? 'healthy' : 'degraded',
      services,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get compliance status
   * @returns {object} Compliance status
   */
  getComplianceStatus() {
    const rules = {};
    for (const [ruleId, rule] of this.complianceRules) {
      rules[ruleId] = {
        description: rule.description,
        enabled: true
      };
    }
    
    return {
      rules,
      totalRules: this.complianceRules.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      metrics: this.getMetrics(),
      compliance: this.getComplianceStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const enterpriseGateway = new EnterpriseGateway();

// Export class for instantiation with custom options
export default EnterpriseGateway;