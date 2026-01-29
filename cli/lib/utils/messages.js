// cli/lib/utils/messages.js
export const professionalMessages = {
  start: [
    "AI Orchestration initialized. Ready for mission.",
    "Analyzing project graph for optimal path...",
    "System check complete. Starting task execution.",
    "Leveraging 16 specialized agents for development."
  ],
  
  success: [
    "✓ Task completed successfully. Alignment verified.",
    "✓ System integrity confirmed. Code merged.",
    "✓ Orchestration successful. Results saved.",
    "✓ Professional SaaS standards achieved."
  ],
  
  error: [
    "✕ Task failed. Analyzing logs for recovery...",
    "✕ System anomaly detected. Diagnostic required.",
    "✕ Orchestration interrupted. Please check configuration.",
    "✕ Quality gate failed. Refactoring recommended."
  ],
  
  loading: [
    "Initializing agent pipeline...",
    "Scanning project context...",
    "Optimizing orchestration logic...",
    "Verifying system state..."
  ]
};

export function getRandomMessage(type) {
  const messages = professionalMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}