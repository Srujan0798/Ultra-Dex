// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Server module
 * @module lsp/server
 */


// Copyright (c) 2026 Ultra-Dex
// Project UltraLSP: Lightweight Language Server for ultra-dex.yaml
// Implements a subset of LSP 3.16 over Stdio

import { TextDocument } from 'vscode-languageserver-textdocument';

const documents = new Map();

// Completion items for ultra-dex.yaml
const COMPLETIONS = [
    { label: 'stack', kind: 14, detail: 'Project stack (next, remix, etc.)', insertText: 'stack: ' },
    { label: 'auth', kind: 14, detail: 'Authentication provider', insertText: 'auth: ' },
    { label: 'database', kind: 14, detail: 'Database provider', insertText: 'database: ' },
    { label: 'orm', kind: 14, detail: 'ORM (prisma, drizzle)', insertText: 'orm: ' },
    { label: 'payments', kind: 14, detail: 'Payment provider (stripe)', insertText: 'payments: ' },
    { label: 'analytics', kind: 14, detail: 'Analytics provider (posthog)', insertText: 'analytics: ' },
    { label: 'agents', kind: 14, detail: 'AgPrompts configuration', insertText: 'agents:\n  model: ' },
];

// Buffer for incoming messages
let buffer = '';

process.stdin.on('data', (chunk) => {
    buffer += chunk.toString();
    while (true) {
        const lengthMatch = buffer.match(/Content-Length: (\d+)\r\n\r\n/);
        if (!lengthMatch) break;

        const contentLength = parseInt(lengthMatch[1], 10);
        const messageStart = lengthMatch.index + lengthMatch[0].length;

        if (buffer.length < messageStart + contentLength) break;

        const rawMessage = buffer.slice(messageStart, messageStart + contentLength);
        buffer = buffer.slice(messageStart + contentLength);

        try {
            const message = JSON.parse(rawMessage);
            handleMessage(message);
        } catch (e) {
            logger.error('Failed to parse message', e);
        }
    }
});

function handleMessage(message) {
    if (message.method === 'initialize') {
        sendResponse(message.id, {
            capabilities: {
                textDocumentSync: 1, // Full sync
                completionProvider: {
                    resolveProvider: false,
                    triggerCharacters: [':', ' ']
                }
            }
        });
    } else if (message.method === 'textDocument/didOpen') {
        // Track document
    } else if (message.method === 'textDocument/completion') {
        sendResponse(message.id, {
            isIncomplete: false,
            items: COMPLETIONS
        });
    } else if (message.method === 'shutdown') {
        sendResponse(message.id, null);
    } else if (message.method === 'exit') {
        process.exit(0);
    }
}

function sendResponse(id, result) {
    const json = JSON.stringify({
        jsonrpc: '2.0',
        id: id,
        result: result
    });
    const headers = `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n`;
    process.stdout.write(headers + json);
}

logger.error('UltraLSP Server Started');
