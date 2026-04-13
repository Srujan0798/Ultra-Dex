import { AgentOrchestrator } from '../orchestration/index.js';
import { createSessionContainer, resolveOptional } from './container.js';
import { DI_TOKENS } from './tokens.js';
function createSessionScope(sessionId, overrides = []) {
  return createSessionContainer(sessionId, overrides);
}
function getSessionId(targetContainer) {
  return resolveOptional(DI_TOKENS.sessionId, targetContainer);
}
function resolveSessionOrchestrator(sessionId, overrides = []) {
  const sessionContainer = createSessionScope(sessionId, overrides);
  return {
    sessionContainer,
    orchestrator: sessionContainer.resolve(AgentOrchestrator),
  };
}
export { createSessionScope, getSessionId, resolveSessionOrchestrator };
