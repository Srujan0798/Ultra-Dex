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
import { Vision } from './vision.js';
let VisionAgent = class extends BaseAgent {
  constructor(options = {}) {
    super("vision-agent", {
      ...options,
      capabilities: ["image-analysis", "object-detection", "ocr", "visual-qa", ...options.capabilities || []]
    });
    this.vision = new Vision(options.vision);
  }
  /**
   * Execute vision task
   */
  async onExecute(task) {
    const { action, imagePath, params } = task;
    switch (action) {
      case "analyze":
        return await this.analyzeImage(imagePath, params);
      case "detect-objects":
        return await this.detectObjects(imagePath, params);
      case "extract-text":
        return await this.extractText(imagePath, params);
      case "describe":
        return await this.describeImage(imagePath, params);
      case "compare":
        return await this.compareImages(params);
      case "visual-qa":
        return await this.visualQA(imagePath, params);
      default:
        throw new Error(`Unknown vision action: ${action}`);
    }
  }
  /**
   * Analyze image
   */
  async analyzeImage(imagePath, options = {}) {
    return await this.vision.processImage(imagePath, options);
  }
  /**
   * Detect objects
   */
  async detectObjects(imagePath, options = {}) {
    const analysis = await this.vision.processImage(imagePath, options);
    return analysis.analysis.objects || [];
  }
  /**
   * Extract text from image
   */
  async extractText(imagePath, options = {}) {
    const analysis = await this.vision.processImage(imagePath, options);
    return analysis.analysis.text || {};
  }
  /**
   * Describe image
   */
  async describeImage(imagePath, options = {}) {
    return await this.vision.describeImage(imagePath);
  }
  /**
   * Compare images
   */
  async compareImages(options = {}) {
    const { image1, image2 } = options;
    return await this.vision.compareImages(image1, image2);
  }
  /**
   * Visual question answering
   */
  async visualQA(imagePath, options = {}) {
    const { question } = options;
    const analysis = await this.vision.processImage(imagePath);
    return {
      question,
      imagePath,
      analysis,
      answer: "Based on the visual analysis..."
    };
  }
};
VisionAgent = __decorateClass([
  singleton()
], VisionAgent);
var vision_agent_default = VisionAgent;
export {
  VisionAgent,
  vision_agent_default as default
};
