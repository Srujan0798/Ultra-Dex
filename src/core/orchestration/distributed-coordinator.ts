var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
import WebSocket from "ws";
import http from "http";
import express from "express";
import { createLogger } from '../../utils/logging.js';
import { SystemHealthChecker } from '../system/health-checker.js';
import { AgentCoordinationProtocol } from '../protocols/coordination.js';
import { AgentCommunicationBus } from './communication-bus.js';
import { AgentRegistry } from './registry.js';
let DistributedCoordinator = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      instanceId: options.instanceId || `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      port: options.port || 8080,
      host: options.host || "localhost",
      discoveryUrls: options.discoveryUrls || [],
      heartbeatInterval: options.heartbeatInterval || 3e4,
      // 30 seconds
      healthCheckInterval: options.healthCheckInterval || 6e4,
      // 1 minute
      loadBalanceThreshold: options.loadBalanceThreshold || 0.8,
      // 80% utilization
      maxConcurrentTasks: options.maxConcurrentTasks || 10,
      enableWebSocket: options.enableWebSocket !== false,
      enableHttpApi: options.enableHttpApi !== false,
      enableDiscovery: options.enableDiscovery !== false,
      enableFailover: options.enableFailover !== false,
      enableLoadBalancing: options.enableLoadBalancing !== false,
      enablePerformanceMetrics: options.enablePerformanceMetrics !== false,
      ...options
    };
    this.logger = createLogger("DistributedCoordinator");
    this.healthChecker = new SystemHealthChecker();
    this.coordinationProtocol = new AgentCoordinationProtocol();
    this.commBus = new AgentCommunicationBus();
    this.registry = options.agentRegistry || new AgentRegistry();
    this.orchestrator = options.orchestrator;
    this.executionEngine = options.executionEngine;
    this.performanceMetrics = options.performanceMetrics || null;
    this.instanceId = this.options.instanceId;
    this.status = "initializing";
    this.lastHeartbeat = Date.now();
    this.peers = /* @__PURE__ */ new Map();
    this.taskQueue = [];
    this.activeTasks = /* @__PURE__ */ new Map();
    this.taskHistory = [];
    this.httpServer = null;
    this.wsServer = null;
    this.wsClients = /* @__PURE__ */ new Map();
    this.expressApp = null;
    this.heartbeatTimer = null;
    this.healthCheckTimer = null;
    this.discoveryTimer = null;
    this.metrics = {
      tasksProcessed: 0,
      tasksFailed: 0,
      tasksDelegated: 0,
      loadBalancingEvents: 0,
      failoverEvents: 0,
      discoveryEvents: 0,
      avgResponseTime: 0
    };
  }
  /**
   * Initialize the distributed coordinator
   */
  async initialize() {
    try {
      this.status = "initializing";
      this.logger.info("Initializing DistributedCoordinator", { instanceId: this.instanceId });
      await this.coordinationProtocol.initialize();
      await this.commBus.initialize();
      await this.registry.initialize();
      if (this.performanceMetrics && typeof this.performanceMetrics.startCollection === "function") {
        this.performanceMetrics.startCollection();
      }
      this.setupHealthChecks();
      if (this.options.enableHttpApi) {
        await this.setupHttpApi();
      }
      if (this.options.enableWebSocket) {
        await this.setupWebSocketServer();
      }
      this.startHeartbeat();
      this.startHealthChecks();
      if (this.options.enableDiscovery) {
        this.startDiscovery();
      }
      this.status = "active";
      this.logger.info("DistributedCoordinator initialized successfully", {
        instanceId: this.instanceId,
        port: this.options.port,
        features: {
          webSocket: this.options.enableWebSocket,
          httpApi: this.options.enableHttpApi,
          discovery: this.options.enableDiscovery,
          failover: this.options.enableFailover,
          loadBalancing: this.options.enableLoadBalancing
        }
      });
      this.emit("initialized", { instanceId: this.instanceId });
      return this;
    } catch (error) {
      this.status = "failed";
      this.logger.error("Failed to initialize DistributedCoordinator", { error: error.message });
      throw error;
    }
  }
  /**
   * Setup health checks for distributed coordination
   */
  setupHealthChecks() {
    this.healthChecker.registerCheck("peer_connectivity", async () => {
      const connectedPeers = Array.from(this.peers.values()).filter((peer) => peer.status === "connected");
      const totalPeers = this.peers.size;
      return {
        status: totalPeers === 0 || connectedPeers.length > 0 ? "healthy" : "warning",
        details: {
          totalPeers,
          connectedPeers: connectedPeers.length,
          disconnectedPeers: totalPeers - connectedPeers.length
        }
      };
    });
    this.healthChecker.registerCheck("instance_load", async () => {
      const currentLoad = this.activeTasks.size / this.options.maxConcurrentTasks;
      const utilization = Math.min(currentLoad, 1);
      return {
        status: utilization < this.options.loadBalanceThreshold ? "healthy" : "warning",
        details: {
          activeTasks: this.activeTasks.size,
          maxConcurrentTasks: this.options.maxConcurrentTasks,
          utilization: (utilization * 100).toFixed(2) + "%"
        }
      };
    });
    this.healthChecker.registerCheck("task_queue", async () => {
      const queueLength = this.taskQueue.length;
      const isHealthy = queueLength < this.options.maxConcurrentTasks * 2;
      return {
        status: isHealthy ? "healthy" : "warning",
        details: {
          queueLength,
          processingCapacity: this.options.maxConcurrentTasks
        }
      };
    });
  }
  /**
   * Setup HTTP API for inter-instance communication
   */
  async setupHttpApi() {
    this.expressApp = express();
    this.expressApp.use(express.json());
    this.expressApp.get("/health", this.healthChecker.healthHandler.bind(this.healthChecker));
    this.expressApp.get("/ready", this.healthChecker.readyHandler.bind(this.healthChecker));
    this.expressApp.get("/metrics", this.healthChecker.metricsHandler.bind(this.healthChecker));
    this.expressApp.get("/api/v1/status", this.handleStatusRequest.bind(this));
    this.expressApp.post("/api/v1/task", this.handleTaskDelegation.bind(this));
    this.expressApp.get("/api/v1/peers", this.handlePeersRequest.bind(this));
    this.expressApp.post("/api/v1/heartbeat", this.handleHeartbeat.bind(this));
    this.httpServer = http.createServer(this.expressApp);
    await new Promise((resolve, reject) => {
      this.httpServer.listen(this.options.port, this.options.host, (err) => {
        if (err)
          reject(err);
        else
          resolve();
      });
    });
    this.logger.info("HTTP API server started", {
      host: this.options.host,
      port: this.options.port
    });
  }
  /**
   * Setup WebSocket server for real-time communication
   */
  async setupWebSocketServer() {
    this.wsServer = new WebSocket.Server({ server: this.httpServer });
    this.wsServer.on("connection", (ws, req) => {
      const peerId = req.headers["x-peer-id"] || `peer_${Date.now()}`;
      this.wsClients.set(peerId, ws);
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(peerId, message);
        } catch (error) {
          this.logger.warn("Invalid WebSocket message received", { peerId, error: error.message });
        }
      });
      ws.on("close", () => {
        this.wsClients.delete(peerId);
        this.updatePeerStatus(peerId, "disconnected");
      });
      ws.on("error", (error) => {
        this.logger.warn("WebSocket error", { peerId, error: error.message });
      });
      ws.send(JSON.stringify({
        type: "handshake",
        instanceId: this.instanceId,
        timestamp: Date.now()
      }));
    });
    this.logger.info("WebSocket server started");
  }
  /**
   * Handle WebSocket messages
   */
  async handleWebSocketMessage(peerId, message) {
    try {
      switch (message.type) {
        case "handshake":
          await this.handlePeerHandshake(peerId, message);
          break;
        case "heartbeat":
          await this.handlePeerHeartbeat(peerId, message);
          break;
        case "task_request":
          await this.handleTaskRequest(peerId, message);
          break;
        case "task_response":
          await this.handleTaskResponse(peerId, message);
          break;
        case "load_update":
          await this.handleLoadUpdate(peerId, message);
          break;
        case "peer_discovery":
          await this.handlePeerDiscovery(peerId, message);
          break;
        default:
          this.logger.warn("Unknown WebSocket message type", { peerId, type: message.type });
      }
    } catch (error) {
      this.logger.error("Error handling WebSocket message", { peerId, message, error: error.message });
    }
  }
  /**
   * Handle peer handshake
   */
  async handlePeerHandshake(peerId, message) {
    const peer = {
      id: message.instanceId,
      url: message.url || `ws://${message.host || "localhost"}:${message.port || 8080}`,
      status: "connected",
      lastSeen: Date.now(),
      capabilities: message.capabilities || [],
      load: message.load || 0,
      version: message.version || "1.0.0"
    };
    this.peers.set(peerId, peer);
    this.emit("peer:connected", peer);
    this.logger.info("Peer connected", { peerId: peer.id, capabilities: peer.capabilities });
    const ws = this.wsClients.get(peerId);
    if (ws) {
      ws.send(JSON.stringify({
        type: "handshake_ack",
        instanceId: this.instanceId,
        capabilities: await this.getInstanceCapabilities(),
        load: this.getCurrentLoad(),
        timestamp: Date.now()
      }));
    }
  }
  /**
   * Handle peer heartbeat
   */
  async handlePeerHeartbeat(peerId, message) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastSeen = Date.now();
      peer.load = message.load || 0;
      peer.status = "connected";
    }
  }
  /**
   * Handle task delegation request
   */
  async handleTaskRequest(peerId, message) {
    const { taskId, task, priority = 1 } = message;
    if (this.activeTasks.size >= this.options.maxConcurrentTasks) {
      const ws2 = this.wsClients.get(peerId);
      if (ws2) {
        ws2.send(JSON.stringify({
          type: "task_rejected",
          taskId,
          reason: "at_capacity",
          timestamp: Date.now()
        }));
      }
      return;
    }
    this.taskQueue.push({
      id: taskId,
      task,
      priority,
      sourcePeer: peerId,
      queuedAt: Date.now()
    });
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    this.logger.info("Task queued from peer", { taskId, peerId, queueLength: this.taskQueue.length });
    const ws = this.wsClients.get(peerId);
    if (ws) {
      ws.send(JSON.stringify({
        type: "task_accepted",
        taskId,
        timestamp: Date.now()
      }));
    }
    this.processTaskQueue();
  }
  /**
   * Handle task response
   */
  async handleTaskResponse(peerId, message) {
    const { taskId, result, success, error } = message;
    const task = this.activeTasks.get(taskId);
    if (task) {
      this.activeTasks.delete(taskId);
      if (success) {
        this.metrics.tasksProcessed++;
        this.emit("task:completed", { taskId, result, peerId });
      } else {
        this.metrics.tasksFailed++;
        this.emit("task:failed", { taskId, error, peerId });
      }
      const responseTime = Date.now() - task.startedAt;
      this.updateAverageResponseTime(responseTime);
      this.logger.info("Task completed by peer", { taskId, peerId, success, responseTime });
    }
    this.processTaskQueue();
  }
  /**
   * Handle load update from peer
   */
  async handleLoadUpdate(peerId, message) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.load = message.load;
      peer.lastSeen = Date.now();
    }
  }
  /**
   * Handle peer discovery
   */
  async handlePeerDiscovery(peerId, message) {
    if (message.peers && Array.isArray(message.peers)) {
      for (const discoveredPeer of message.peers) {
        if (discoveredPeer.id !== this.instanceId && !this.peers.has(discoveredPeer.id)) {
          await this.connectToPeer(discoveredPeer);
        }
      }
    }
  }
  /**
   * HTTP API handlers
   */
  async handleStatusRequest(req, res) {
    const status = {
      instanceId: this.instanceId,
      status: this.status,
      uptime: process.uptime(),
      load: this.getCurrentLoad(),
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      peers: Array.from(this.peers.values()).map((peer) => ({
        id: peer.id,
        status: peer.status,
        load: peer.load,
        lastSeen: peer.lastSeen
      })),
      metrics: this.metrics,
      timestamp: Date.now()
    };
    res.json(status);
  }
  async handleTaskDelegation(req, res) {
    const { task, priority = 1, timeout = 3e4 } = req.body;
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const targetPeer = this.selectPeerForTask(task);
    if (targetPeer) {
      try {
        await this.delegateTaskToPeer(targetPeer.id, { taskId, task, priority });
        this.metrics.tasksDelegated++;
        res.json({
          taskId,
          status: "delegated",
          targetPeer: targetPeer.id,
          timestamp: Date.now()
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to delegate task", details: error.message });
      }
    } else {
      res.status(503).json({ error: "No available peers for task delegation" });
    }
  }
  async handlePeersRequest(req, res) {
    const peers = Array.from(this.peers.values()).map((peer) => ({
      id: peer.id,
      url: peer.url,
      status: peer.status,
      load: peer.load,
      lastSeen: peer.lastSeen,
      capabilities: peer.capabilities
    }));
    res.json({ peers, instanceId: this.instanceId });
  }
  async handleHeartbeat(req, res) {
    const { peerId, load, capabilities } = req.body;
    if (peerId) {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.lastSeen = Date.now();
        peer.load = load || 0;
        if (capabilities)
          peer.capabilities = capabilities;
        peer.status = "connected";
      }
    }
    res.json({
      instanceId: this.instanceId,
      load: this.getCurrentLoad(),
      capabilities: await this.getInstanceCapabilities(),
      timestamp: Date.now()
    });
  }
  /**
   * Start heartbeat process
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.options.heartbeatInterval);
  }
  /**
   * Send heartbeat to all connected peers
   */
  async sendHeartbeat() {
    const heartbeat = {
      type: "heartbeat",
      instanceId: this.instanceId,
      load: this.getCurrentLoad(),
      capabilities: await this.getInstanceCapabilities(),
      timestamp: Date.now()
    };
    for (const [peerId, ws] of this.wsClients) {
      try {
        ws.send(JSON.stringify(heartbeat));
      } catch (error) {
        this.logger.warn("Failed to send heartbeat to peer", { peerId, error: error.message });
        this.wsClients.delete(peerId);
        this.updatePeerStatus(peerId, "disconnected");
      }
    }
    for (const [peerId, peer] of this.peers) {
      if (peer.status === "connected" && peer.url.startsWith("http")) {
        try {
          await this.sendHttpHeartbeat(peer);
        } catch (error) {
          this.logger.warn("Failed to send HTTP heartbeat to peer", { peerId, error: error.message });
          this.updatePeerStatus(peerId, "disconnected");
        }
      }
    }
    this.lastHeartbeat = Date.now();
  }
  /**
   * Send HTTP heartbeat to a peer
   */
  async sendHttpHeartbeat(peer) {
    const axios = (await import("axios")).default;
    await axios.post(`${peer.url}/api/v1/heartbeat`, {
      peerId: this.instanceId,
      load: this.getCurrentLoad(),
      capabilities: await this.getInstanceCapabilities()
    }, {
      timeout: 5e3
    });
  }
  /**
   * Start health checks
   */
  startHealthChecks() {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.options.healthCheckInterval);
  }
  /**
   * Perform health checks on peers
   */
  async performHealthChecks() {
    const now = Date.now();
    const timeoutThreshold = this.options.heartbeatInterval * 3;
    for (const [peerId, peer] of this.peers) {
      if (now - peer.lastSeen > timeoutThreshold) {
        this.updatePeerStatus(peerId, "disconnected");
        this.logger.warn("Peer health check failed - marking as disconnected", { peerId });
      }
    }
  }
  /**
   * Start peer discovery
   */
  startDiscovery() {
    this.discoveryTimer = setInterval(async () => {
      await this.discoverPeers();
    }, this.options.heartbeatInterval * 2);
  }
  /**
   * Discover peers from configured URLs
   */
  async discoverPeers() {
    if (!this.options.discoveryUrls || this.options.discoveryUrls.length === 0) {
      return;
    }
    const axios = (await import("axios")).default;
    for (const discoveryUrl of this.options.discoveryUrls) {
      try {
        const response = await axios.get(`${discoveryUrl}/api/v1/peers`, { timeout: 5e3 });
        const { peers } = response.data;
        for (const peer of peers) {
          if (peer.id !== this.instanceId && !this.peers.has(peer.id)) {
            await this.connectToPeer(peer);
            this.metrics.discoveryEvents++;
          }
        }
        this.logger.info("Peer discovery completed", {
          discoveryUrl,
          discoveredPeers: peers.length
        });
      } catch (error) {
        this.logger.warn("Peer discovery failed", { discoveryUrl, error: error.message });
      }
    }
  }
  /**
   * Connect to a discovered peer
   */
  async connectToPeer(peerInfo) {
    try {
      if (peerInfo.url.startsWith("ws://") || peerInfo.url.startsWith("wss://")) {
        await this.connectWebSocketPeer(peerInfo);
      } else if (peerInfo.url.startsWith("http://") || peerInfo.url.startsWith("https://")) {
        this.peers.set(peerInfo.id, {
          ...peerInfo,
          status: "connected",
          lastSeen: Date.now()
        });
      }
    } catch (error) {
      this.logger.warn("Failed to connect to peer", { peerId: peerInfo.id, error: error.message });
    }
  }
  /**
   * Connect to peer via WebSocket
   */
  async connectWebSocketPeer(peerInfo) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(peerInfo.url, {
        headers: {
          "x-peer-id": this.instanceId
        }
      });
      ws.on("open", () => {
        this.wsClients.set(peerInfo.id, ws);
        this.peers.set(peerInfo.id, {
          ...peerInfo,
          status: "connected",
          lastSeen: Date.now()
        });
        ws.send(JSON.stringify({
          type: "handshake",
          instanceId: this.instanceId,
          host: this.options.host,
          port: this.options.port,
          url: `ws://${this.options.host}:${this.options.port}`,
          capabilities: [],
          load: this.getCurrentLoad(),
          timestamp: Date.now()
        }));
        this.logger.info("Connected to WebSocket peer", { peerId: peerInfo.id });
        resolve();
      });
      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(peerInfo.id, message);
        } catch (error) {
          this.logger.warn("Invalid message from peer", { peerId: peerInfo.id, error: error.message });
        }
      });
      ws.on("close", () => {
        this.wsClients.delete(peerInfo.id);
        this.updatePeerStatus(peerInfo.id, "disconnected");
      });
      ws.on("error", (error) => {
        this.logger.warn("WebSocket peer connection error", { peerId: peerInfo.id, error: error.message });
        reject(error);
      });
      setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 1e4);
    });
  }
  /**
   * Update peer status
   */
  updatePeerStatus(peerId, status) {
    const peer = this.peers.get(peerId);
    if (peer) {
      const oldStatus = peer.status;
      peer.status = status;
      if (oldStatus !== status) {
        this.emit("peer:status_changed", { peerId, oldStatus, newStatus: status });
        this.logger.info("Peer status changed", { peerId, oldStatus, newStatus: status });
        if (status === "disconnected" && this.options.enableFailover) {
          this.handlePeerFailure(peerId);
        }
      }
    }
  }
  /**
   * Handle peer failure (failover)
   */
  async handlePeerFailure(peerId) {
    this.metrics.failoverEvents++;
    this.logger.warn("Handling peer failure", { peerId });
    const failedTasks = Array.from(this.activeTasks.values()).filter((task) => task.assignedPeer === peerId);
    for (const task of failedTasks) {
      this.activeTasks.delete(task.id);
      this.taskQueue.unshift(task);
      this.logger.info("Task redistributed due to peer failure", { taskId: task.id, peerId });
    }
    this.processTaskQueue();
    this.emit("peer:failed", { peerId, redistributedTasks: failedTasks.length });
  }
  /**
   * Process task queue
   */
  async processTaskQueue() {
    if (this.taskQueue.length === 0 || this.activeTasks.size >= this.options.maxConcurrentTasks) {
      return;
    }
    if (this.options.enableLoadBalancing && this.shouldDelegateTask()) {
      const task = this.taskQueue.shift();
      const targetPeer = this.selectPeerForTask(task.task);
      if (targetPeer) {
        try {
          await this.delegateTaskToPeer(targetPeer.id, {
            taskId: task.id,
            task: task.task,
            priority: task.priority
          });
          this.activeTasks.set(task.id, {
            ...task,
            assignedPeer: targetPeer.id,
            startedAt: Date.now()
          });
          this.metrics.tasksDelegated++;
          this.logger.info("Task delegated to peer", { taskId: task.id, peerId: targetPeer.id });
        } catch (error) {
          this.logger.warn("Failed to delegate task, re-queuing", { taskId: task.id, error: error.message });
          this.taskQueue.unshift(task);
        }
      } else {
        this.taskQueue.unshift(task);
      }
    }
  }
  /**
   * Check if we should delegate a task (load balancing)
   */
  shouldDelegateTask() {
    const currentLoad = this.getCurrentLoad();
    return currentLoad >= this.options.loadBalanceThreshold;
  }
  /**
   * Select best peer for task delegation
   */
  selectPeerForTask(task) {
    const availablePeers = Array.from(this.peers.values()).filter((peer) => peer.status === "connected").sort((a, b) => a.load - b.load);
    if (availablePeers.length === 0) {
      return null;
    }
    return availablePeers[0];
  }
  /**
   * Delegate task to peer
   */
  async delegateTaskToPeer(peerId, taskData) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }
    if (peer.url.startsWith("ws://") || peer.url.startsWith("wss://")) {
      const ws = this.wsClients.get(peerId);
      if (ws) {
        ws.send(JSON.stringify({
          type: "task_request",
          ...taskData,
          timestamp: Date.now()
        }));
      } else {
        throw new Error(`WebSocket connection to peer ${peerId} not available`);
      }
    } else if (peer.url.startsWith("http://") || peer.url.startsWith("https://")) {
      const axios = (await import("axios")).default;
      await axios.post(`${peer.url}/api/v1/task`, taskData, { timeout: 5e3 });
    } else {
      throw new Error(`Unsupported peer URL scheme for ${peerId}`);
    }
  }
  /**
   * Get current instance load
   */
  getCurrentLoad() {
    return Math.min(this.activeTasks.size / this.options.maxConcurrentTasks, 1);
  }
  /**
   * Get instance capabilities
   */
  async getInstanceCapabilities() {
    try {
      const agents = this.registry.getAllAgents();
      return agents.map((agent) => agent.capabilities || []).flat();
    } catch (_error) {
      return ["general"];
    }
  }
  /**
   * Update average response time
   */
  updateAverageResponseTime(responseTime) {
    const totalTasks = this.metrics.tasksProcessed + this.metrics.tasksFailed;
    if (totalTasks > 0) {
      this.metrics.avgResponseTime = (this.metrics.avgResponseTime * (totalTasks - 1) + responseTime) / totalTasks;
    } else {
      this.metrics.avgResponseTime = responseTime;
    }
  }
  /**
   * Submit task to distributed coordinator
   */
  async submitTask(task, options = {}) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const submitStartTime = Date.now();
    if (this.performanceMetrics) {
      this.performanceMetrics.recordMetric("coordinator.tasks_submitted", 1);
    }
    if (this.activeTasks.size < this.options.maxConcurrentTasks) {
      this.activeTasks.set(taskId, {
        id: taskId,
        task,
        startedAt: Date.now(),
        local: true
      });
      try {
        const result = await this.executeTaskLocally(task, options);
        this.activeTasks.delete(taskId);
        this.metrics.tasksProcessed++;
        const responseTime = Date.now() - this.activeTasks.get(taskId)?.startedAt || 0;
        this.updateAverageResponseTime(responseTime);
        if (this.performanceMetrics) {
          this.performanceMetrics.recordLatency("coordinator.local_execution", responseTime, {
            taskId,
            success: true
          });
          this.performanceMetrics.recordMetric("coordinator.tasks_completed_locally", 1);
        }
        return { taskId, result, success: true };
      } catch (error) {
        this.activeTasks.delete(taskId);
        this.metrics.tasksFailed++;
        if (this.performanceMetrics) {
          const responseTime = Date.now() - submitStartTime;
          this.performanceMetrics.recordLatency("coordinator.local_execution", responseTime, {
            taskId,
            success: false,
            error: error.message.substring(0, 100)
          });
          this.performanceMetrics.recordMetric("coordinator.tasks_failed_locally", 1);
        }
        throw error;
      }
    } else if (this.options.enableLoadBalancing) {
      const targetPeer = this.selectPeerForTask(task);
      if (targetPeer) {
        const delegationStartTime = Date.now();
        await this.delegateTaskToPeer(targetPeer.id, { taskId, task, priority: options.priority || 1 });
        this.activeTasks.set(taskId, {
          id: taskId,
          task,
          assignedPeer: targetPeer.id,
          startedAt: Date.now()
        });
        if (this.performanceMetrics) {
          const delegationTime = Date.now() - delegationStartTime;
          this.performanceMetrics.recordLatency("coordinator.task_delegation", delegationTime, {
            taskId,
            targetPeer: targetPeer.id
          });
          this.performanceMetrics.recordMetric("coordinator.tasks_delegated", 1);
        }
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.activeTasks.delete(taskId);
            reject(new Error("Task delegation timeout"));
          }, options.timeout || 3e4);
          this.once(`task:completed:${taskId}`, (result) => {
            clearTimeout(timeout);
            resolve({ taskId, result, success: true });
          });
          this.once(`task:failed:${taskId}`, (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      }
    }
    this.taskQueue.push({
      id: taskId,
      task,
      priority: options.priority || 1,
      queuedAt: Date.now()
    });
    return { taskId, status: "queued" };
  }
  /**
   * Execute task locally (integrate with existing Orchestrator/ExecutionEngine)
   */
  async executeTaskLocally(task, options = {}) {
    this.logger.info("Executing task locally via Orchestrator/ExecutionEngine", { task: task.substring(0, 100) });
    if (!this.orchestrator || !this.executionEngine) {
      throw new Error("Orchestrator and ExecutionEngine not provided to DistributedCoordinator");
    }
    const executionTask = await this.orchestrator.orchestrate(task, options.mode || "simple", options);
    const result = await this.executionEngine.execute(executionTask);
    return result;
  }
  /**
   * Execute task locally with streaming
   */
  async *executeTaskLocallyStream(task, options = {}) {
    const { onProgress } = options;
    this.logger.info("Executing task locally with streaming via Orchestrator/ExecutionEngine", { task: task.substring(0, 100) });
    if (!this.orchestrator || !this.executionEngine) {
      throw new Error("Orchestrator and ExecutionEngine not provided to DistributedCoordinator");
    }
    const executionTask = await this.orchestrator.orchestrate(task, options.mode || "simple", options);
    yield* this.executionEngine.executeStream(executionTask, { onProgress });
  }
  /**
   * Get coordinator metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      instanceId: this.instanceId,
      status: this.status,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      connectedPeers: Array.from(this.peers.values()).filter((p) => p.status === "connected").length,
      totalPeers: this.peers.size,
      load: this.getCurrentLoad(),
      uptime: process.uptime()
    };
  }
  /**
   * Shutdown the coordinator
   */
  async shutdown() {
    this.status = "shutting_down";
    this.logger.info("Shutting down DistributedCoordinator");
    if (this.heartbeatTimer)
      clearInterval(this.heartbeatTimer);
    if (this.healthCheckTimer)
      clearInterval(this.healthCheckTimer);
    if (this.discoveryTimer)
      clearInterval(this.discoveryTimer);
    for (const [peerId, ws] of this.wsClients) {
      try {
        ws.close();
      } catch (error) {
        this.logger.warn("Error closing WebSocket connection", { peerId, error: error.message });
      }
    }
    this.wsClients.clear();
    if (this.httpServer) {
      await new Promise((resolve) => {
        this.httpServer.close(resolve);
      });
    }
    for (const [peerId] of this.peers) {
      this.updatePeerStatus(peerId, "disconnected");
    }
    this.status = "shutdown";
    this.logger.info("DistributedCoordinator shutdown complete");
    this.emit("shutdown", { instanceId: this.instanceId });
  }
};
DistributedCoordinator = __decorateClass([
  singleton()
], DistributedCoordinator);
var distributed_coordinator_default = DistributedCoordinator;
export {
  DistributedCoordinator,
  distributed_coordinator_default as default
};
