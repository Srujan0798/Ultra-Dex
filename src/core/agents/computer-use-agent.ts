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
import { BaseAgent } from './base-agent.js';
let ComputerUseAgent = class extends BaseAgent {
  constructor(options = {}) {
    super("computer-use-agent", {
      ...options,
      capabilities: ["screen-capture", "click", "type", "navigate", "execute", ...options.capabilities || []]
    });
    this.config = {
      displaySize: options.displaySize || { width: 1920, height: 1080 },
      clickDelay: options.clickDelay || 100,
      typeDelay: options.typeDelay || 50,
      screenshotInterval: options.screenshotInterval || 500,
      ...options
    };
    this.screen = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.currentWindow = null;
  }
  /**
   * Initialize computer use agent
   */
  async onInitialize() {
    this.screen = {
      width: this.config.displaySize.width,
      height: this.config.displaySize.height,
      pixels: new Uint8Array(this.config.displaySize.width * this.config.displaySize.height * 3)
    };
    this.emit("computer-use.initialized");
    return this;
  }
  /**
   * Execute computer use task
   */
  async onExecute(task) {
    const { action, params } = task;
    switch (action) {
      case "screenshot":
        return await this.screenshot();
      case "click":
        return await this.click(params);
      case "type":
        return await this.type(params);
      case "navigate":
        return await this.navigate(params);
      case "scroll":
        return await this.scroll(params);
      case "find-element":
        return await this.findElement(params);
      case "execute-command":
        return await this.executeCommand(params);
      default:
        throw new Error(`Unknown computer action: ${action}`);
    }
  }
  /**
   * Take a screenshot
   */
  async screenshot() {
    this.emit("screenshot.capturing");
    const screenshot = {
      timestamp: Date.now(),
      data: Buffer.from(this.screen.pixels),
      width: this.screen.width,
      height: this.screen.height,
      format: "rgb24"
    };
    this.emit("screenshot.captured", screenshot);
    return screenshot;
  }
  /**
   * Click at position
   */
  async click(params) {
    const { x, y, button = "left", doubleClick = false } = params;
    if (x < 0 || x >= this.screen.width || y < 0 || y >= this.screen.height) {
      throw new Error(`Click coordinates out of bounds: (${x}, ${y})`);
    }
    this.mouseX = x;
    this.mouseY = y;
    const clickCount = doubleClick ? 2 : 1;
    this.emit("mouse.click", { x, y, button, clickCount });
    await this.delay(this.config.clickDelay);
    return {
      success: true,
      position: { x, y },
      button,
      timestamp: Date.now()
    };
  }
  /**
   * Type text
   */
  async type(params) {
    const { text, delay = this.config.typeDelay } = params;
    this.emit("text.typing", { text });
    for (let i = 0; i < text.length; i++) {
      this.emit("text.typed-character", { char: text[i] });
      await this.delay(delay);
    }
    return {
      success: true,
      textLength: text.length,
      totalTime: text.length * delay
    };
  }
  /**
   * Navigate to URL
   */
  async navigate(params) {
    const { url } = params;
    this.emit("navigation.starting", { url });
    this.currentWindow = {
      url,
      title: `Document - ${url}`,
      navigatedAt: Date.now()
    };
    await this.delay(1e3);
    this.emit("navigation.completed", { url });
    return {
      success: true,
      url,
      title: this.currentWindow.title
    };
  }
  /**
   * Scroll
   */
  async scroll(params) {
    const { direction, amount = 3 } = params;
    this.emit("scroll.starting", { direction, amount });
    await this.delay(100 * amount);
    this.emit("scroll.completed", { direction, amount });
    return {
      success: true,
      direction,
      amount
    };
  }
  /**
   * Find element on screen
   */
  async findElement(params) {
    const { selector, timeout = 5e3 } = params;
    this.emit("element.searching", { selector });
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = this.simulateElementSearch(selector);
      if (element) {
        this.emit("element.found", { selector, element });
        return element;
      }
      await this.delay(100);
    }
    throw new Error(`Element not found: ${selector}`);
  }
  /**
   * Simulate element search
   */
  simulateElementSearch(selector) {
    const elements = {
      button: { x: 100, y: 100, width: 80, height: 40, text: "Click me" },
      input: { x: 150, y: 200, width: 200, height: 30, type: "text" },
      link: { x: 50, y: 300, width: 100, height: 20, href: "https://example.com" }
    };
    return elements[selector];
  }
  /**
   * Execute command
   */
  async executeCommand(params) {
    const { command, shell = "bash" } = params;
    this.emit("command.executing", { command, shell });
    await this.delay(500);
    return {
      success: true,
      command,
      output: `Executed: ${command}`,
      exitCode: 0
    };
  }
  /**
   * Wait for condition
   */
  async waitFor(condition, timeout = 5e3) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition();
        if (result) {
          return result;
        }
      } catch {
      }
      await this.delay(100);
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }
  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Get screen state
   */
  getScreenState() {
    return {
      width: this.screen.width,
      height: this.screen.height,
      mousePosition: { x: this.mouseX, y: this.mouseY },
      currentWindow: this.currentWindow
    };
  }
  /**
   * Get status
   */
  getStatus() {
    return {
      ...super.getStatus(),
      screenSize: `${this.screen.width}x${this.screen.height}`,
      mousePosition: { x: this.mouseX, y: this.mouseY },
      currentWindow: this.currentWindow?.url || null
    };
  }
};
ComputerUseAgent = __decorateClass([
  singleton()
], ComputerUseAgent);
var computer_use_agent_default = ComputerUseAgent;
export {
  ComputerUseAgent,
  computer_use_agent_default as default
};
