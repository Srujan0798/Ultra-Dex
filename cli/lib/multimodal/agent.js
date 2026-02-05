import { VisionAgent } from '../agents/vision.js';
import { loadDesignInput, extractDesignTokens, buildComponentBlueprint } from './design.js';
import { generateDocsFromFiles, writeDocsReport } from './docs.js';

export class MultimodalAgent {
  constructor(options = {}) {
    this.options = options;
    this.vision = new VisionAgent(options.vision || {});
  }

  async designToCode(input) {
    const design = await loadDesignInput(input);
    const tokens = extractDesignTokens(typeof design.content === 'string' ? design.content : '');
    const blueprint = buildComponentBlueprint(this.options.componentName, tokens);
    return {
      design,
      blueprint,
      message: 'Generated blueprint from design input.'
    };
  }

  async analyzeScreenshot(imagePath) {
    return this.vision.analyzeScreenshot(imagePath);
  }

  async codeToDocs(files, outputPath = 'docs/AUTO-DOCS.md') {
    const docs = await generateDocsFromFiles(files);
    const path = await writeDocsReport(docs, outputPath);
    return { docs, path };
  }
}
