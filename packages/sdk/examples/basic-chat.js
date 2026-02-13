/**
 * Ultra-Dex SDK — Basic Chat Example
 *
 * The simplest possible usage: register a provider, send a message, get a response.
 *
 * Usage:
 *   node packages/sdk/examples/basic-chat.js
 */

import { UltraDex } from '../index.ts';

// 1. Create an UltraDex instance
const dex = new UltraDex({
    defaultProvider: 'echo',
    timeoutMs: 30_000,
});

// 2. Register a provider (this is a mock — replace with a real API client)
dex.registerProvider('echo', {
    async chat(messages, opts) {
        const lastMessage = messages[messages.length - 1];
        return {
            role: 'assistant',
            content: `Echo: ${lastMessage.content}`,
            usage: { promptTokens: 10, completionTokens: 15 },
        };
    },

    async *stream(messages) {
        const lastMessage = messages[messages.length - 1];
        const words = `Echo: ${lastMessage.content}`.split(' ');
        for (const word of words) {
            yield { delta: word + ' ' };
        }
    },

    async embed(text) {
        // Simple hash-based mock embedding
        const hash = [...text].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        return { embedding: [hash / 1000, hash / 2000, hash / 3000] };
    },
});

// 3. Chat
console.log('--- Chat ---');
const response = await dex.chat([
    { role: 'user', content: 'Hello Ultra-Dex!' },
]);
console.log('Response:', response.content);
console.log('Tokens:', response.usage);

// 4. Stream
console.log('\n--- Stream ---');
process.stdout.write('Response: ');
for await (const chunk of dex.stream([
    { role: 'user', content: 'Stream this back to me' },
])) {
    process.stdout.write(chunk.delta);
}
console.log();

// 5. Embed
console.log('\n--- Embed ---');
const embedding = await dex.embed('Ultra-Dex is great');
console.log('Embedding:', embedding.embedding);
