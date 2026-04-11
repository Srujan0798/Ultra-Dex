// Copyright (c) 2026 Ultra-Dex

import { getAllIntents, getIntentConfidence, translateToCommand } from '../nlp/router.js';
import { suggestCommand } from './suggestion.js';

const EXACT_MATCH_TYPES = new Set(['exact', 'direct', 'alias', 'exact-keyword']);

export function getProgramCommandNames(program) {
  const names = new Set();

  for (const command of program.commands ?? []) {
    if (typeof command?.name === 'function') {
      names.add(command.name());
    }

    if (typeof command?.aliases === 'function') {
      for (const alias of command.aliases()) {
        names.add(alias);
      }
    }
  }

  return Array.from(names).filter(Boolean).sort();
}

export function splitCommandString(command) {
  if (!command) return [];

  const parts = String(command).match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return parts.map((part) => part.replace(/^['"]|['"]$/g, ''));
}

export function analyzeCliInput(rawArgs, commandNames, options = {}) {
  const args = Array.isArray(rawArgs) ? rawArgs.filter(Boolean) : [];
  const rawInput = args.join(' ').trim();
  const knownCommands = new Set(commandNames || []);
  const firstToken = args[0] || '';

  if (!rawInput) {
    return {
      type: 'dashboard',
      rawInput,
      commandNames: Array.from(knownCommands),
    };
  }

  if (firstToken.startsWith('-') || knownCommands.has(firstToken)) {
    return {
      type: 'passthrough',
      rawInput,
      commandNames: Array.from(knownCommands),
    };
  }

  const suggestionThreshold = options.suggestionThreshold ?? (firstToken.length >= 6 ? 3 : 2);
  const typoSuggestion = suggestCommand(firstToken, Array.from(knownCommands), suggestionThreshold);
  const confidence = getIntentConfidence(rawInput);
  const translatedCommand = confidence.intent ? translateToCommand(rawInput) : null;
  const translatedArgs = translatedCommand ? splitCommandString(translatedCommand).slice(1) : [];
  const alternatives = getAllIntents(rawInput, 3);
  const intentThreshold = options.intentThreshold ?? 0.75;
  const strongIntent =
    Boolean(confidence.intent) &&
    (confidence.confidence >= intentThreshold || EXACT_MATCH_TYPES.has(confidence.matchType));
  const preferTypoSuggestion =
    Boolean(typoSuggestion) && args.length === 1 && !EXACT_MATCH_TYPES.has(confidence.matchType);

  if (translatedArgs.length > 0 && strongIntent && !preferTypoSuggestion) {
    return {
      type: 'rewrite',
      rawInput,
      intent: confidence.intent,
      confidence: confidence.confidence,
      matchType: confidence.matchType,
      translatedCommand,
      translatedArgs,
      alternatives,
      typoSuggestion,
    };
  }

  return {
    type: 'unknown',
    rawInput,
    intent: confidence.intent,
    confidence: confidence.confidence,
    matchType: confidence.matchType,
    translatedCommand,
    translatedArgs,
    alternatives,
    typoSuggestion,
  };
}

export default {
  analyzeCliInput,
  getProgramCommandNames,
  splitCommandString,
};
