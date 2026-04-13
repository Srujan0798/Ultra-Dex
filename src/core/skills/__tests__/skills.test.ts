/**
 * Tests for Ultra-Dex Skills System
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { initializeSkills, SkillsAPI } from '../index.js';
import { getSkill, listSkills } from '../framework.js';
import { SkillRegistry } from '../framework.js';

describe('Skills System', () => {
  let registry: SkillRegistry;

  beforeAll(() => {
    registry = new SkillRegistry();
    initializeSkills(registry);
  });

  describe('Skill Registration', () => {
    it('should register all 20 skills', () => {
      const skills = listSkills();
      expect(skills).toHaveLength(20);
    });

    it('should register 10 engineering skills', () => {
      const skills = registry.findByCategory('engineering');
      expect(skills).toHaveLength(10);
    });

    it('should register 10 data skills', () => {
      const skills = registry.findByCategory('data');
      expect(skills).toHaveLength(10);
    });
  });

  describe('Engineering Skills', () => {
    it('should have /code-review skill', () => {
      const skill = getSkill('/code-review');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Code Review');
      expect(skill?.category).toBe('engineering');
      expect(skill?.agent.id).toBe('reviewer');
    });

    it('should have /architecture skill', () => {
      const skill = getSkill('/architecture');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Architecture Decision');
      expect(skill?.agent.id).toBe('cto');
    });

    it('should have /debug skill', () => {
      const skill = getSkill('/debug');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Debug');
    });

    it('should have /sql-queries skill', () => {
      const skill = getSkill('/sql-queries');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('SQL Queries');
      expect(skill?.category).toBe('data');
    });
  });

  describe('Data Skills', () => {
    it('should have /build-dashboard skill', () => {
      const skill = getSkill('/build-dashboard');
      expect(skill).toBeDefined();
      expect(skill?.agent.id).toBe('frontend');
    });

    it('should have /analyze skill', () => {
      const skill = getSkill('/analyze');
      expect(skill).toBeDefined();
      expect(skill?.category).toBe('data');
    });
  });

  describe('Skill Configuration', () => {
    it('should have determinism config (temperature: 0)', () => {
      const skill = getSkill('/code-review');
      expect(skill?.config.temperature).toBe(0);
    });

    it('should have routing configuration', () => {
      const skill = getSkill('/code-review');
      expect(skill?.routing.providerPriority).toContain('anthropic');
      expect(skill?.routing.fallback).toBe(true);
    });

    it('should have memory configuration', () => {
      const skill = getSkill('/code-review');
      expect(skill?.memory.storeOutput).toBe(true);
      expect(skill?.memory.searchable).toBe(true);
    });
  });

  describe('SkillsAPI', () => {
    it('should create API instance', () => {
      const api = new SkillsAPI();
      expect(api).toBeDefined();
      expect(api.list()).toHaveLength(20);
    });

    it('should find by category', () => {
      const api = new SkillsAPI();
      const engineering = api.findByCategory('engineering');
      expect(engineering).toHaveLength(10);

      const data = api.findByCategory('data');
      expect(data).toHaveLength(10);
    });

    it('should check skill existence', () => {
      const api = new SkillsAPI();
      expect(api.has('/code-review')).toBe(true);
      expect(api.has('/unknown')).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    it('should render prompt templates', async () => {
      const { renderTemplate } = await import('../framework.js');

      const template = 'Review {{language}} code: {{code}}';
      const result = renderTemplate(template, {
        language: 'javascript',
        code: 'function add(a,b){return a+b}',
      });

      expect(result).toContain('Review javascript code');
      expect(result).toContain('function add(a,b){return a+b}');
    });
  });
});

describe('Skill Definitions', () => {
  it('should have valid input/output schemas', () => {
    const skills = listSkills();

    for (const skill of skills) {
      expect(skill.input).toBeDefined();
      expect(skill.output).toBeDefined();
      expect(skill.promptTemplate).toBeDefined();
      expect(skill.promptTemplate.length).toBeGreaterThan(0);
    }
  });

  it('should have connector support defined', () => {
    const skills = listSkills();

    const withConnectors = skills.filter((s) => s.connectors && s.connectors.length > 0);
    expect(withConnectors.length).toBeGreaterThan(0);
  });
});
