// Copyright (c) 2026 Ultra-Dex
// Vision Agent - Visual analysis agent

import { BaseAgent } from './base-agent.js';
import { Vision } from './vision.js';

/**
 * VisionAgent
 * Agent specialized in visual analysis and understanding
 */
export class VisionAgent extends BaseAgent {
  constructor(options = {}) {
    super('vision-agent', {
      ...options,
      capabilities: ['image-analysis', 'object-detection', 'ocr', 'visual-qa', ...(options.capabilities || [])]
    });
    this.vision = new Vision(options.vision);
  }

  /**
   * Execute vision task
   */
  async onExecute(task) {
    const { action, imagePath, params } = task;

    switch (action) {
      case 'analyze':
        return await this.analyzeImage(imagePath, params);
      case 'detect-objects':
        return await this.detectObjects(imagePath, params);
      case 'extract-text':
        return await this.extractText(imagePath, params);
      case 'describe':
        return await this.describeImage(imagePath, params);
      case 'compare':
        return await this.compareImages(params);
      case 'visual-qa':
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
      answer: 'Based on the visual analysis...'
    };
  }
}

export default VisionAgent;
