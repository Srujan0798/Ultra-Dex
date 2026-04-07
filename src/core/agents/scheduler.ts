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
let Scheduler = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.scheduledTasks = /* @__PURE__ */ new Map();
    this.executedTasks = /* @__PURE__ */ new Map();
    this.config = {
      timezone: options.timezone || "UTC",
      enablePersistence: options.enablePersistence || false,
      maxConcurrentSchedules: options.maxConcurrentSchedules || 10,
      ...options
    };
    this.state = "idle";
    this.activeSchedules = /* @__PURE__ */ new Map();
    this.timers = /* @__PURE__ */ new Map();
  }
  /**
   * Initialize scheduler
   */
  async initialize() {
    this.state = "ready";
    this.emit("scheduler.ready");
    return this;
  }
  /**
   * Schedule a task to run at a specific time
   */
  scheduleAt(taskId, task, executeTime, options = {}) {
    if (this.scheduledTasks.has(taskId)) {
      throw new Error(`Task ${taskId} already scheduled`);
    }
    const now = Date.now();
    const delay = executeTime - now;
    if (delay < 0) {
      throw new Error(`Cannot schedule task in the past: ${delay}ms ago`);
    }
    const schedule = {
      id: taskId,
      task,
      type: "one-time",
      executeTime,
      delay,
      status: "scheduled",
      createdAt: now,
      retryCount: 0,
      maxRetries: options.maxRetries || 0,
      ...options
    };
    this.scheduledTasks.set(taskId, schedule);
    const timer = setTimeout(() => {
      this.executeScheduledTask(taskId);
    }, delay);
    this.timers.set(taskId, timer);
    this.emit("task.scheduled", { taskId, executeTime });
    return taskId;
  }
  /**
   * Schedule a task with a delay
   */
  scheduleDelay(taskId, task, delayMs, options = {}) {
    return this.scheduleAt(taskId, task, Date.now() + delayMs, options);
  }
  /**
   * Schedule a recurring task (cron-like)
   */
  scheduleRecurring(taskId, task, schedule, options = {}) {
    if (this.scheduledTasks.has(taskId)) {
      throw new Error(`Task ${taskId} already scheduled`);
    }
    const recurringSchedule = {
      id: taskId,
      task,
      type: "recurring",
      pattern: schedule,
      status: "scheduled",
      createdAt: Date.now(),
      lastExecution: null,
      nextExecution: this.calculateNextExecution(schedule),
      executionCount: 0,
      ...options
    };
    this.scheduledTasks.set(taskId, recurringSchedule);
    this.scheduleNextExecution(taskId, recurringSchedule);
    this.emit("recurring-task.scheduled", { taskId, pattern: schedule });
    return taskId;
  }
  /**
   * Schedule next execution for recurring task
   */
  scheduleNextExecution(taskId, schedule) {
    const delay = Math.max(0, schedule.nextExecution - Date.now());
    const timer = setTimeout(() => {
      this.executeScheduledTask(taskId);
      schedule.nextExecution = this.calculateNextExecution(schedule.pattern);
      this.scheduleNextExecution(taskId, schedule);
    }, delay);
    this.timers.set(taskId, timer);
  }
  /**
   * Calculate next execution time for pattern
   */
  calculateNextExecution(pattern) {
    const now = /* @__PURE__ */ new Date();
    if (pattern.type === "interval") {
      return now.getTime() + pattern.interval;
    }
    if (pattern.type === "cron") {
      return this.parseSimpleCron(pattern.cron, now);
    }
    if (pattern.type === "daily") {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(pattern.hour || 0, pattern.minute || 0, 0, 0);
      return next.getTime();
    }
    if (pattern.type === "weekly") {
      const next = new Date(now);
      const daysUntilTarget = (pattern.dayOfWeek - next.getDay() + 7) % 7;
      next.setDate(next.getDate() + (daysUntilTarget || 7));
      next.setHours(pattern.hour || 0, pattern.minute || 0, 0, 0);
      return next.getTime();
    }
    throw new Error(`Unknown schedule pattern type: ${pattern.type}`);
  }
  /**
   * Parse simple cron expression
   */
  parseSimpleCron(cronExpression, now) {
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) {
      throw new Error("Cron expression must have 5 parts: minute hour day month dayOfWeek");
    }
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const next = new Date(now);
    let found = false;
    for (let i = 0; i < 365; i++) {
      next.setDate(next.getDate() + 1);
      next.setHours(hour === "*" ? 0 : parseInt(hour), 0, 0, 0);
      if (this.matchesCronPart(minute, next.getMinutes()) && this.matchesCronPart(hour, next.getHours()) && (dayOfMonth === "*" || this.matchesCronPart(dayOfMonth, next.getDate())) && (month === "*" || this.matchesCronPart(month, next.getMonth() + 1)) && (dayOfWeek === "*" || this.matchesCronPart(dayOfWeek, next.getDay()))) {
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error("Could not find next execution time for cron expression");
    }
    return next.getTime();
  }
  /**
   * Check if value matches cron part
   */
  matchesCronPart(cronPart, value) {
    if (cronPart === "*")
      return true;
    if (cronPart.includes(",")) {
      return cronPart.split(",").some((part) => parseInt(part) === value);
    }
    if (cronPart.includes("-")) {
      const [start, end] = cronPart.split("-").map(Number);
      return value >= start && value <= end;
    }
    return parseInt(cronPart) === value;
  }
  /**
   * Execute a scheduled task
   */
  async executeScheduledTask(taskId) {
    const schedule = this.scheduledTasks.get(taskId);
    if (!schedule)
      return;
    this.emit("task.execution.started", { taskId });
    try {
      schedule.status = "executing";
      const result = await this.performTaskExecution(schedule.task);
      schedule.status = "completed";
      schedule.lastExecution = Date.now();
      schedule.executionCount = (schedule.executionCount || 0) + 1;
      this.executedTasks.set(taskId, {
        taskId,
        executedAt: Date.now(),
        result,
        success: true
      });
      this.emit("scheduled-task.executed", { taskId, result });
      if (schedule.type === "one-time") {
        this.scheduledTasks.delete(taskId);
        this.timers.delete(taskId);
      }
      return result;
    } catch (error) {
      schedule.status = "failed";
      schedule.retryCount++;
      this.executedTasks.set(taskId, {
        taskId,
        executedAt: Date.now(),
        error,
        success: false
      });
      if (schedule.retryCount < (schedule.maxRetries || 0)) {
        const retryDelay = (schedule.retryDelay || 1e3) * Math.pow(2, schedule.retryCount - 1);
        this.scheduleDelay(`${taskId}-retry-${schedule.retryCount}`, schedule.task, retryDelay);
        this.emit("scheduled-task.retry", { taskId, attempt: schedule.retryCount });
      } else {
        this.emit("scheduled-task.failed", { taskId, error });
        if (schedule.type === "one-time") {
          this.scheduledTasks.delete(taskId);
          this.timers.delete(taskId);
        }
      }
      throw error;
    }
  }
  /**
   * Perform actual task execution
   */
  async performTaskExecution(task) {
    if (task.handler) {
      return await task.handler(task.data);
    }
    if (task.agent) {
      return await task.agent.execute(task);
    }
    throw new Error("Task must have handler or agent");
  }
  /**
   * Cancel a scheduled task
   */
  cancelSchedule(taskId) {
    const schedule = this.scheduledTasks.get(taskId);
    if (!schedule) {
      return false;
    }
    if (this.timers.has(taskId)) {
      clearTimeout(this.timers.get(taskId));
      this.timers.delete(taskId);
    }
    this.scheduledTasks.delete(taskId);
    this.emit("schedule.cancelled", { taskId });
    return true;
  }
  /**
   * Pause a scheduled task
   */
  pauseSchedule(taskId) {
    const schedule = this.scheduledTasks.get(taskId);
    if (!schedule) {
      return false;
    }
    if (this.timers.has(taskId)) {
      clearTimeout(this.timers.get(taskId));
      this.timers.delete(taskId);
    }
    schedule.status = "paused";
    this.emit("schedule.paused", { taskId });
    return true;
  }
  /**
   * Resume a paused schedule
   */
  resumeSchedule(taskId) {
    const schedule = this.scheduledTasks.get(taskId);
    if (!schedule || schedule.status !== "paused") {
      return false;
    }
    schedule.status = "scheduled";
    if (schedule.type === "one-time") {
      const delay = Math.max(0, schedule.executeTime - Date.now());
      const timer = setTimeout(() => {
        this.executeScheduledTask(taskId);
      }, delay);
      this.timers.set(taskId, timer);
    } else {
      this.scheduleNextExecution(taskId, schedule);
    }
    this.emit("schedule.resumed", { taskId });
    return true;
  }
  /**
   * Get schedule status
   */
  getScheduleStatus(taskId) {
    return this.scheduledTasks.get(taskId);
  }
  /**
   * List all schedules
   */
  listSchedules(filter = {}) {
    let schedules = Array.from(this.scheduledTasks.values());
    if (filter.status) {
      schedules = schedules.filter((s) => s.status === filter.status);
    }
    if (filter.type) {
      schedules = schedules.filter((s) => s.type === filter.type);
    }
    return schedules;
  }
  /**
   * Get execution history
   */
  getExecutionHistory(taskId, limit = 10) {
    return Array.from(this.executedTasks.values()).filter((e) => e.taskId === taskId).slice(-limit);
  }
  /**
   * Shutdown scheduler
   */
  async shutdown() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.state = "shutdown";
    this.emit("scheduler.shutdown");
  }
};
Scheduler = __decorateClass([
  singleton()
], Scheduler);
var scheduler_default = Scheduler;
export {
  Scheduler,
  scheduler_default as default
};
