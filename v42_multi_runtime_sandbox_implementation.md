# 🚀 ULTRA-DEX V4.2.0 - MULTI-RUNTIME SANDBOX

## 🎯 Python, Go, Rust Runtime Support

### Objective
Add secure sandboxed execution environments for Python, Go, and Rust runtimes with Docker isolation and resource limits.

### Implementation Plan

#### 1. Multi-Runtime Engine
```javascript
// File: cli/lib/sandbox/multi-runtime.js
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class MultiRuntimeSandbox {
  constructor(options = {}) {
    this.sandboxDir = options.sandboxDir || path.join(process.cwd(), '.ultra-dex', 'sandbox');
    this.timeouts = options.timeouts || {
      python: 30000, // 30 seconds
      go: 30000,
      rust: 30000,
      javascript: 10000
    };
    this.resources = options.resources || {
      memory: '128m', // 128MB
      cpu: '0.5'    // 50% CPU
    };
  }

  async initialize() {
    await fs.mkdir(this.sandboxDir, { recursive: true });
  }

  async execute(code, runtime, options = {}) {
    const executionId = uuidv4();
    const executionDir = path.join(this.sandboxDir, executionId);
    
    await fs.mkdir(executionDir, { recursive: true });
    
    try {
      // Write code to temporary file
      const codeFile = await this.writeCodeFile(code, runtime, executionDir);
      
      // Execute based on runtime
      let result;
      switch (runtime.toLowerCase()) {
        case 'python':
          result = await this.executePython(codeFile, options);
          break;
        case 'go':
          result = await this.executeGo(codeFile, options);
          break;
        case 'rust':
          result = await this.executeRust(codeFile, options);
          break;
        case 'javascript':
        case 'js':
          result = await this.executeJavaScript(code, options);
          break;
        default:
          throw new Error(`Unsupported runtime: ${runtime}`);
      }
      
      return {
        success: true,
        output: result.stdout,
        error: result.stderr,
        executionTime: result.executionTime,
        executionId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionId
      };
    } finally {
      // Cleanup
      await this.cleanup(executionDir);
    }
  }

  async writeCodeFile(code, runtime, dir) {
    let extension, filename;
    
    switch (runtime.toLowerCase()) {
      case 'python':
        extension = '.py';
        filename = 'main.py';
        break;
      case 'go':
        extension = '.go';
        filename = 'main.go';
        break;
      case 'rust':
        extension = '.rs';
        filename = 'main.rs';
        break;
      case 'javascript':
      case 'js':
        extension = '.js';
        filename = 'main.js';
        break;
      default:
        throw new Error(`Unsupported runtime: ${runtime}`);
    }
    
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, code);
    return filepath;
  }

  async executePython(filepath, options) {
    const startTime = Date.now();
    
    const { stdout, stderr } = await execAsync(
      `python3 ${filepath}`, 
      { 
        timeout: this.timeouts.python,
        maxBuffer: 1024 * 1024 // 1MB
      }
    );
    
    return {
      stdout,
      stderr,
      executionTime: Date.now() - startTime
    };
  }

  async executeGo(filepath, options) {
    const startTime = Date.now();
    const dir = path.dirname(filepath);
    const executable = path.join(dir, 'main');
    
    // Compile Go code
    await execAsync(`go build -o ${executable} ${filepath}`, { 
      cwd: dir,
      timeout: 10000 
    });
    
    // Execute compiled binary
    const { stdout, stderr } = await execAsync(executable, { 
      timeout: this.timeouts.go,
      maxBuffer: 1024 * 1024
    });
    
    return {
      stdout,
      stderr,
      executionTime: Date.now() - startTime
    };
  }

  async executeRust(filepath, options) {
    const startTime = Date.now();
    const dir = path.dirname(filepath);
    const executable = path.join(dir, 'main');
    
    // Compile Rust code
    await execAsync(`rustc -o ${executable} ${filepath}`, { 
      cwd: dir,
      timeout: 15000 
    });
    
    // Execute compiled binary
    const { stdout, stderr } = await execAsync(executable, { 
      timeout: this.timeouts.rust,
      maxBuffer: 1024 * 1024
    });
    
    return {
      stdout,
      stderr,
      executionTime: Date.now() - startTime
    };
  }

  async executeJavaScript(code, options) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', ['-e', code], {
        timeout: this.timeouts.javascript,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            stdout,
            stderr,
            executionTime: Date.now() - startTime
          });
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error('JavaScript execution timed out'));
      }, this.timeouts.javascript);
    });
  }

  async executeInDocker(image, code, runtime, options = {}) {
    const executionId = uuidv4();
    const executionDir = path.join(this.sandboxDir, executionId);
    
    await fs.mkdir(executionDir, { recursive: true });
    
    try {
      const codeFile = await this.writeCodeFile(code, runtime, executionDir);
      
      // Create Docker container with resource limits
      const dockerCmd = [
        'docker', 'run',
        '--rm',
        `--memory=${this.resources.memory}`,
        `--cpus=${this.resources.cpu}`,
        '--network=none', // No network access
        '-v', `${executionDir}:/workspace`,
        '-w', '/workspace',
        image,
        runtime === 'python' ? 'python3' : 
        runtime === 'go' ? 'go' : 
        runtime === 'rust' ? 'rustc' : 'node',
        path.basename(codeFile)
      ].join(' ');
      
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(dockerCmd, {
        timeout: this.timeouts[runtime] || 30000
      });
      
      return {
        success: true,
        output: stdout,
        error: stderr,
        executionTime: Date.now() - startTime,
        executionId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionId
      };
    } finally {
      await this.cleanup(executionDir);
    }
  }

  async cleanup(dir) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async validateCode(code, runtime) {
    // Basic security validation
    const dangerousPatterns = [
      /import\s+os/, // Python OS operations
      /import\s+"os"/, // Go OS operations
      /std::process::Command/, // Rust process spawning
      /child_process/, // Node.js child processes
      /spawn/, // Process spawning
      /exec/, // Execution commands
      /eval/, // Evaluation
      /require\(['"`]\.\/\.\.\/['"`]\)/, // Path traversal
      /fs\./, // File system access
      /process\.env/ // Environment access
    ];

    for (const pattern of dangerousPatterns) {
      if (code.match(pattern)) {
        throw new Error(`Potentially dangerous code detected: ${pattern}`);
      }
    }

    return true;
  }

  async executeSecure(code, runtime, options = {}) {
    // Validate code first
    await this.validateCode(code, runtime);
    
    // Use Docker sandbox for extra security
    const dockerImages = {
      python: 'python:3.11-alpine',
      go: 'golang:1.21-alpine',
      rust: 'rust:1.70-alpine',
      javascript: 'node:18-alpine'
    };

    if (dockerImages[runtime]) {
      return await this.executeInDocker(dockerImages[runtime], code, runtime, options);
    } else {
      return await this.execute(code, runtime, options);
    }
  }
}
```

#### 2. Docker-based Sandbox
```javascript
// File: cli/lib/sandbox/docker-sandbox.js
import { MultiRuntimeSandbox } from './multi-runtime.js';
import { execAsync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DockerSandbox extends MultiRuntimeSandbox {
  constructor(options = {}) {
    super(options);
    this.dockerEnabled = this.checkDockerAvailability();
  }

  async checkDockerAvailability() {
    try {
      await execAsync('docker --version');
      return true;
    } catch {
      return false;
    }
  }

  async createSandboxImage(runtime) {
    const dockerfiles = {
      python: `
FROM python:3.11-alpine
RUN apk add --no-cache gcc musl-dev linux-headers
WORKDIR /app
COPY . .
USER nobody
`,
      go: `
FROM golang:1.21-alpine
WORKDIR /app
COPY . .
USER nobody
`,
      rust: `
FROM rust:1.70-alpine
WORKDIR /app
COPY . .
USER nobody
`,
      javascript: `
FROM node:18-alpine
WORKDIR /app
COPY . .
USER node
`
    };

    const dockerfile = dockerfiles[runtime];
    if (!dockerfile) {
      throw new Error(`No Dockerfile template for runtime: ${runtime}`);
    }

    const imageTag = `ultradex-${runtime}-sandbox:${Date.now()}`;
    
    // Write Dockerfile
    await fs.writeFile(path.join(this.sandboxDir, 'Dockerfile'), dockerfile);
    
    // Build image
    await execAsync(`docker build -t ${imageTag} .`, {
      cwd: this.sandboxDir
    });

    return imageTag;
  }

  async executeWithDocker(imageTag, code, runtime, options = {}) {
    const executionId = uuidv4();
    const executionDir = path.join(this.sandboxDir, executionId);
    
    await fs.mkdir(executionDir, { recursive: true });
    
    try {
      const codeFile = await this.writeCodeFile(code, runtime, executionDir);
      
      const dockerCmd = [
        'docker', 'run',
        '--rm',
        '--user=nobody',
        `--memory=${this.resources.memory}`,
        `--cpus=${this.resources.cpu}`,
        '--network=none',
        '--read-only',
        '-v', `${executionDir}:/workspace:ro`,
        '-w', '/workspace',
        imageTag
      ].join(' ');

      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(dockerCmd, {
        timeout: this.timeouts[runtime] || 30000
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
        executionTime: Date.now() - startTime,
        executionId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionId
      };
    } finally {
      await this.cleanup(executionDir);
    }
  }

  async executeSecure(code, runtime, options = {}) {
    if (!this.dockerEnabled) {
      throw new Error('Docker is not available. Please install Docker to use secure sandbox.');
    }

    await this.validateCode(code, runtime);
    
    const imageTag = await this.createSandboxImage(runtime);
    try {
      return await this.executeWithDocker(imageTag, code, runtime, options);
    } finally {
      // Clean up image
      await execAsync(`docker rmi ${imageTag}`, { stdio: 'ignore' }).catch(() => {});
    }
  }
}
```

#### 3. CLI Commands for Sandbox
```javascript
// File: cli/lib/commands/sandbox.js
import { MultiRuntimeSandbox } from '../sandbox/multi-runtime.js';
import { DockerSandbox } from '../sandbox/docker-sandbox.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import fs from 'fs/promises';
import path from 'path';

export async function registerSandboxCommand(program) {
  const sandboxCmd = program
    .command('sandbox')
    .alias('exec')
    .description('Execute code in secure sandbox');

  const sandbox = new MultiRuntimeSandbox();

  await sandbox.initialize();

  sandboxCmd
    .command('run <runtime> <code>')
    .description('Execute code in sandbox')
    .option('-s, --secure', 'Use secure Docker sandbox')
    .option('-t, --timeout <ms>', 'Execution timeout in milliseconds', '30000')
    .option('-f, --file <file>', 'Read code from file')
    .action(async (runtime, code, options) => {
      try {
        let codeToExecute = code;
        
        if (options.file) {
          codeToExecute = await fs.readFile(options.file, 'utf8');
        }

        const sandboxInstance = options.secure ? new DockerSandbox() : sandbox;
        sandboxInstance.timeouts[runtime] = parseInt(options.timeout);

        const result = await sandboxInstance.executeSecure(codeToExecute, runtime);
        
        if (result.success) {
          printSuccess(`✅ Execution completed in ${result.executionTime}ms`);
          if (result.output) {
            printInfo('Output:');
            console.log(result.output);
          }
        } else {
          printError(`❌ Execution failed: ${result.error}`);
        }
      } catch (error) {
        printError(`Sandbox execution failed: ${error.message}`);
      }
    });

  sandboxCmd
    .command('python <code>')
    .description('Execute Python code')
    .option('-f, --file <file>', 'Read code from file')
    .option('-s, --secure', 'Use secure Docker sandbox')
    .action(async (code, options) => {
      const codeToExecute = options.file ? await fs.readFile(options.file, 'utf8') : code;
      const sandboxInstance = options.secure ? new DockerSandbox() : sandbox;
      
      const result = await sandboxInstance.executeSecure(codeToExecute, 'python');
      
      if (result.success) {
        printSuccess(`Python execution completed in ${result.executionTime}ms`);
        if (result.output) {
          console.log(result.output);
        }
      } else {
        printError(`Python execution failed: ${result.error}`);
      }
    });

  sandboxCmd
    .command('go <code>')
    .description('Execute Go code')
    .option('-f, --file <file>', 'Read code from file')
    .option('-s, --secure', 'Use secure Docker sandbox')
    .action(async (code, options) => {
      const codeToExecute = options.file ? await fs.readFile(options.file, 'utf8') : code;
      const sandboxInstance = options.secure ? new DockerSandbox() : sandbox;
      
      const result = await sandboxInstance.executeSecure(codeToExecute, 'go');
      
      if (result.success) {
        printSuccess(`Go execution completed in ${result.executionTime}ms`);
        if (result.output) {
          console.log(result.output);
        }
      } else {
        printError(`Go execution failed: ${result.error}`);
      }
    });

  sandboxCmd
    .command('rust <code>')
    .description('Execute Rust code')
    .option('-f, --file <file>', 'Read code from file')
    .option('-s, --secure', 'Use secure Docker sandbox')
    .action(async (code, options) => {
      const codeToExecute = options.file ? await fs.readFile(options.file, 'utf8') : code;
      const sandboxInstance = options.secure ? new DockerSandbox() : sandbox;
      
      const result = await sandboxInstance.executeSecure(codeToExecute, 'rust');
      
      if (result.success) {
        printSuccess(`Rust execution completed in ${result.executionTime}ms`);
        if (result.output) {
          console.log(result.output);
        }
      } else {
        printError(`Rust execution failed: ${result.error}`);
      }
    });

  sandboxCmd
    .command('test')
    .description('Test sandbox functionality')
    .action(async () => {
      printInfo('Testing sandbox functionality...');
      
      const tests = [
        { runtime: 'python', code: 'print("Hello from Python!")' },
        { runtime: 'javascript', code: 'console.log("Hello from JavaScript!");' }
      ];

      for (const test of tests) {
        try {
          const result = await sandbox.executeSecure(test.code, test.runtime);
          if (result.success) {
            printSuccess(`✅ ${test.runtime}: ${result.output.trim()}`);
          } else {
            printError(`❌ ${test.runtime}: ${result.error}`);
          }
        } catch (error) {
          printError(`❌ ${test.runtime}: ${error.message}`);
        }
      }
    });

  sandboxCmd
    .command('status')
    .description('Check sandbox status')
    .action(async () => {
      printInfo('Sandbox Status:');
      printInfo(`- Sandbox directory: ${sandbox.sandboxDir}`);
      printInfo(`- Docker available: ${await sandbox.checkDockerAvailability()}`);
      printInfo(`- Timeouts: ${JSON.stringify(sandbox.timeouts)}`);
      printInfo(`- Resources: ${JSON.stringify(sandbox.resources)}`);
    });
}
```

#### 4. Update Main CLI Registration
```javascript
// Add to cli/bin/ultra-dex.js
import { registerSandboxCommand } from './lib/commands/sandbox.js';

// Add after other registrations
registerSandboxCommand(program);
```

#### 5. Security Configuration
```javascript
// File: cli/lib/sandbox/security.js
export const SECURITY_POLICIES = {
  python: {
    allowedImports: [
      'math', 'random', 'datetime', 'collections', 'itertools',
      'functools', 'operator', 'json', 're', 'string', 'sys'
    ],
    blockedImports: [
      'os', 'subprocess', 'sys', 'importlib', 'compileall',
      'py_compile', 'pickle', 'shelve', 'multiprocessing'
    ]
  },
  go: {
    blockedPackages: [
      'os', 'exec', 'syscall', 'unsafe', 'plugin',
      'net', 'http', 'os/exec', 'syscall', 'unsafe'
    ]
  },
  rust: {
    blockedCrates: [
      'std::process', 'std::fs', 'std::os', 'std::env',
      'tokio::process', 'async_std::process'
    ]
  }
};

export function validateCodeSecurity(code, runtime) {
  const policies = SECURITY_POLICIES[runtime];
  if (!policies) return true;

  // Check for blocked patterns
  if (policies.blockedImports) {
    for (const blocked of policies.blockedImports) {
      if (code.includes(blocked)) {
        throw new Error(`Blocked import detected: ${blocked}`);
      }
    }
  }

  if (policies.blockedPackages) {
    for (const blocked of policies.blockedPackages) {
      if (code.includes(blocked)) {
        throw new Error(`Blocked package detected: ${blocked}`);
      }
    }
  }

  return true;
}
```

### Testing Plan
1. Test Python execution with various code samples
2. Verify Go compilation and execution
3. Test Rust compilation and execution
4. Validate Docker sandbox security
5. Benchmark performance and resource usage

### Success Criteria
- ✅ Python runtime executes code safely
- ✅ Go runtime compiles and executes
- ✅ Rust runtime compiles and executes
- ✅ Docker sandbox provides security isolation
- ✅ Performance acceptable with resource limits

---

**Estimated Timeline:** 3 days
**Priority:** 🟢 MEDIUM
**Status:** Ready for implementation