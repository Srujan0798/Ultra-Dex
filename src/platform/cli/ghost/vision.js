// Copyright (c) 2026 Ultra-Dex
// Project Ghost: Vision System (The Eyes)
// Captures screen state for VLM analysis

// Optional dependencies
import { screenSystem } from './screen.js';

let jimp;
try {
    jimp = (await import('jimp')).default;
} catch (e) {
    jimp = { read: async () => ({ scale: () => { }, getBufferAsync: async () => Buffer.from('') }), MIME_PNG: 'image/png' };
}

export class VisionSystem {
    constructor() {
        this.displays = [];
    }

    /**
     * Capture full screen screenshot
     * @returns {Promise<Buffer>} - Image buffer (PNG)
     */
    async captureParams() {
        try {
            return await screenSystem.capture({ format: 'png' });
        } catch (error) {
            throw new Error(`Failed to capture screen: ${error.message}`);
        }
    }

    /**
     * Capture and optimize for VLM (resize, compress)
     * @param {number} scale - Scale factor (0-1), default 1.0 (no resize)
     * @returns {Promise<string>} - Base64 encoded image string
     */
    async captureForVLM(scale = 1.0) {
        const buffer = await this.captureParams();

        // If scaling is needed, use Jimp
        if (scale < 1.0) {
            const image = await jimp.read(buffer);
            await image.scale(scale);
            // Get buffer back
            const resizedBuffer = await image.getBufferAsync(jimp.MIME_PNG);
            return resizedBuffer.toString('base64');
        }

        return buffer.toString('base64');
    }

    /**
     * List scaling factor recommendation based on resolution
     * High res screens might need downscaling for API cost/latency
     */
    async listDisplays() {
        try {
            const displays = await screenSystem.listDisplays();
            this.displays = displays;
            return displays;
        } catch (e) {
            return [{ id: 'primary', name: 'Primary Display' }];
        }
    }
}

export const visionSystem = new VisionSystem();
export default visionSystem;
