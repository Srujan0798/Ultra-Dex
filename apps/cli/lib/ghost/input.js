// Copyright (c) 2026 Ultra-Dex
// Project Ghost: Input Control (The Hands)
// Wraps robotjs with safety rails

// Optional dependency
let robot;
try {
  robot = (await import('robotjs')).default;
} catch (_e) {
  // Mock robotjs if not found
  robot = {
    setMouseDelay: () => {},
    setKeyboardDelay: () => {},
    moveMouse: () => console.warn('robotjs not found: moveMouse'),
    mouseClick: () => console.warn('robotjs not found: mouseClick'),
    typeString: () => console.warn('robotjs not found: typeString'),
    keyTap: () => console.warn('robotjs not found: keyTap'),
    scrollMouse: () => console.warn('robotjs not found: scrollMouse'),
    getScreenSize: () => ({ width: 1920, height: 1080 }),
  };
}

// Configure defaults (safe to call on mock)
robot.setMouseDelay(10);
robot.setKeyboardDelay(10);

export class InputController {
  constructor(options = {}) {
    this.safeMode = options.safeMode ?? true;
    this.bounds = options.bounds || null; // { x, y, width, height }
  }

  /**
   * Move mouse to coordinates
   */
  async move(x, y) {
    this.validateCoordinates(x, y);
    robot.moveMouse(x, y);
    if (this.safeMode) await this.sleep(100);
  }

  /**
   * Click at current position or specific coordinates
   */
  async click(x, y, button = 'left') {
    if (x !== undefined && y !== undefined) {
      await this.move(x, y);
    }
    robot.mouseClick(button, false);
    if (this.safeMode) await this.sleep(100);
  }

  /**
   * Double click
   */
  async doubleClick(x, y) {
    if (x !== undefined && y !== undefined) {
      await this.move(x, y);
    }
    robot.mouseClick('left', true); // double click
  }

  /**
   * Type text
   */
  async type(text) {
    robot.typeString(text);
  }

  /**
   * Press specific key
   * key: string (e.g., 'enter', 'escape', 'a')
   * modifiers: array (e.g., ['command', 'shift'])
   */
  async pressKey(key, modifiers = []) {
    robot.keyTap(key, modifiers);
  }

  /**
   * Scroll screen
   * RobotJS scroll is limited, simulating via scroll wheel if supported or key presses
   */
  async scroll(amount) {
    robot.scrollMouse(0, amount > 0 ? -10 : 10);
  }

  /**
   * Validate coordinates against bounds
   */
  validateCoordinates(x, y) {
    if (this.bounds) {
      if (
        x < this.bounds.x ||
        x > this.bounds.x + this.bounds.width ||
        y < this.bounds.y ||
        y > this.bounds.y + this.bounds.height
      ) {
        throw new Error(`Coordinates (${x}, ${y}) out of bounds`);
      }
    }
    // Basic sanity check (negative coords)
    if (x < 0 || y < 0) {
      throw new Error(`Invalid coordinates: (${x}, ${y})`);
    }
  }

  /**
   * Get screen size
   */
  getScreenSize() {
    const { width, height } = robot.getScreenSize();
    return { width, height };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const inputController = new InputController();
export default inputController;
