
import { EventEmitter } from 'events';

const CIRCUIT_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
};

class MinimalExecutionController extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      circuitThreshold: options.circuitThreshold ?? 3,
      circuitResetTime: options.circuitResetTime ?? 30000,
    };
    this._circuitState = CIRCUIT_STATES.CLOSED;
    this._circuitFailures = 0;
    this._circuitLastFailure = null;
    this.metrics = { circuitBreaks: 0 };
  }

  _checkCircuit() {
    if (this._circuitState === CIRCUIT_STATES.CLOSED) return true;
    if (this._circuitState === CIRCUIT_STATES.OPEN) {
      const elapsed = Date.now() - this._circuitLastFailure;
      if (elapsed >= this.options.circuitResetTime) {
        this._circuitState = CIRCUIT_STATES.HALF_OPEN;
        this.emit('circuit:half_open');
        return true;
      }
      return false;
    }
    return true;
  }

  _recordCircuitFailure() {
    this._circuitFailures++;
    this._circuitLastFailure = Date.now();

    if (this._circuitState === CIRCUIT_STATES.HALF_OPEN) {
      this._circuitState = CIRCUIT_STATES.OPEN;
      this.metrics.circuitBreaks++;
      this.emit('circuit:open', { failures: this._circuitFailures });
    } else if (this._circuitFailures >= this.options.circuitThreshold) {
      this._circuitState = CIRCUIT_STATES.OPEN;
      this.metrics.circuitBreaks++;
      this.emit('circuit:open', { failures: this._circuitFailures });
    }
  }

  async _executeTask(id) {
    if (!this._checkCircuit()) {
      return { id, success: false, error: 'Circuit open' };
    }
    // Simulate failure
    await new Promise(r => setTimeout(r, 10)); // Small delay to increase chance of race
    this._recordCircuitFailure();
    return { id, success: false, error: 'Task failed' };
  }
}

async function runReproduction() {
  const controller = new MinimalExecutionController({ circuitThreshold: 3 });
  let openEvents = 0;
  controller.on('circuit:open', () => {
    openEvents++;
  });

  console.log('Running 100 concurrent tasks...');
  const tasks = Array.from({ length: 100 }, (_, i) => controller._executeTask(i));
  await Promise.all(tasks);

  console.log(`Circuit open events: ${openEvents}`);
  if (openEvents > 1) {
    console.log('REPRODUCED: Multiple circuit:open events emitted!');
  } else {
    console.log('NOT REPRODUCED: Only one circuit:open event emitted.');
  }
}

runReproduction();
