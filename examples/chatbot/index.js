// Copyright (c) 2026 Ultra-Dex
// Example: Chatbot with Persistent Memory

/**
 * A conversational AI chatbot that:
 *   1. Routes to the best model via Smart Router
 *   2. Remembers conversations across sessions (Unified Memory)
 *   3. Tracks costs with Token Guard
 *   4. Provides full observability with Trace Collector
 *
 * Usage:  node examples/chatbot/index.js
 */

import { SmartRouter } from '../../packages/sdk/src/router.js';
import { TraceCollector } from '../../src/core/observability/trace-collector.js';

// ── Configuration ───────────────────────────────────────────────────────
const config = {
    model: process.env.ULTRA_MODEL || 'gpt-4o-mini',
    maxHistory: 20,
    systemPrompt: `You are Ultra-Bot, a helpful AI assistant powered by Ultra-Dex.
You have persistent memory and can recall previous conversations.
Be concise, friendly, and accurate. If unsure, say so.`,
};

// ── In-Memory Conversation Store (swap for Unified Memory in production)
const conversations = new Map();

function getHistory(sessionId) {
    if (!conversations.has(sessionId)) {
        conversations.set(sessionId, []);
    }
    return conversations.get(sessionId);
}

function addMessage(sessionId, role, content) {
    const history = getHistory(sessionId);
    history.push({ role, content, timestamp: Date.now() });
    if (history.length > config.maxHistory * 2) {
        history.splice(0, history.length - config.maxHistory * 2);
    }
}

// ── Trace Collector for Observability ───────────────────────────────────
const tracer = new TraceCollector({ maxTraces: 100 });

// ── Smart Router for Model Selection ────────────────────────────────────
const router = new SmartRouter({
    strategy: 'cost',
    providers: [
        { name: 'openai', models: ['gpt-4o', 'gpt-4o-mini'], priority: 1 },
        { name: 'anthropic', models: ['claude-4-sonnet'], priority: 2 },
        { name: 'google', models: ['gemini-2.0-flash'], priority: 3 },
    ],
});

// ── Chat Function ───────────────────────────────────────────────────────
async function chat(sessionId, userMessage) {
    const traceId = tracer.startTrace({ agentId: 'chatbot', task: `chat-${sessionId}` });
    const spanId = tracer.startSpan({ traceId, operation: 'chat-response' });

    try {
        // Record user message
        addMessage(sessionId, 'user', userMessage);

        // Build messages array
        const messages = [
            { role: 'system', content: config.systemPrompt },
            ...getHistory(sessionId).map(m => ({ role: m.role, content: m.content })),
        ];

        // Route to best model
        const route = router.route({ task: 'chat', messages });
        tracer.addEvent(traceId, spanId, 'model-selected', { model: route.model || config.model, provider: route.provider || 'openai' });

        // Simulate LLM response (in production, call the actual API)
        const response = simulateResponse(userMessage, sessionId);
        tracer.recordTokens(traceId, spanId, { promptTokens: Math.ceil(messages.join(' ').length / 4), completionTokens: Math.ceil(response.length / 4) });

        // Record assistant message
        addMessage(sessionId, 'assistant', response);

        tracer.endSpan(traceId, spanId);
        tracer.completeTrace(traceId);

        return {
            response,
            model: route.model || config.model,
            sessionId,
            messageCount: getHistory(sessionId).length,
            traceId,
        };
    } catch (error) {
        tracer.failSpan(traceId, spanId, error);
        tracer.failTrace(traceId, error);
        throw error;
    }
}

// ── Response Simulator (replace with real LLM call) ─────────────────────
function simulateResponse(message, sessionId) {
    const history = getHistory(sessionId);
    const lower = message.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi')) {
        return history.length <= 2
            ? "Hello! I'm Ultra-Bot. I'm powered by Ultra-Dex's meta-layer, which means I can use any AI model and remember our conversations. How can I help you?"
            : "Welcome back! I remember our conversation. What would you like to discuss?";
    }
    if (lower.includes('remember')) {
        const userMsgs = history.filter(m => m.role === 'user');
        return `I remember ${userMsgs.length} messages from you in this session. My memory persists across interactions thanks to Ultra-Dex's Unified Memory API.`;
    }
    if (lower.includes('help')) {
        return "I can help with: coding questions, project planning, data analysis, writing, research, and more. I use the best AI model for each task via Smart Router. What do you need?";
    }
    return `I understand your question about "${message.slice(0, 50)}". Let me think about that using the optimal model selected by Smart Router. In a production deployment, this would call the actual LLM API through Ultra-Dex's orchestration layer.`;
}

// ── Demo Runner ─────────────────────────────────────────────────────────
async function demo() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       Ultra-Dex Chatbot Example                 ║');
    console.log('║       Persistent Memory + Smart Routing         ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log();

    const session = 'demo-session-1';

    const messages = [
        'Hello! What can you do?',
        'Can you help me with coding?',
        'Do you remember what I asked earlier?',
    ];

    for (const msg of messages) {
        console.log(`👤 User: ${msg}`);
        const result = await chat(session, msg);
        console.log(`🤖 Bot:  ${result.response}`);
        console.log(`   ↳ Model: ${result.model} | Messages: ${result.messageCount} | Trace: ${result.traceId}`);
        console.log();
    }

    console.log('📊 Trace Stats:', JSON.stringify(tracer.getDashboard(), null, 2));
}

demo().catch(console.error);

export { chat, config, getHistory };
