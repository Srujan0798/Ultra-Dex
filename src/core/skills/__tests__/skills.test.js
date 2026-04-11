// Tests for Ultra-Dex Skills System

const { describe, it, expect, beforeAll } = require('vitest');
const { initializeSkills, SkillsAPI } = require('../index.js');
const { getSkill, listSkills } = require('../framework.js');
const { SkillRegistry } = require('../framework.js');

describe('Skills System', () => {
  let registry;

  beforeAll(() => {
    registry = new SkillRegistry();
    initializeSkills(registry);
  });

  // Update the test to use the SkillRegistry's findByCategory method properly
  // We'll test category filtering by checking the skills list directly

  describe('Skill Registration', () => {
    it('should register all skills', () => {
      const skills = listSkills();
      expect(skills).toHaveLength(38); // 10 eng + 10 data + 9 sales + 9 product
    });

    it('should register 10 engineering skills', () => {
      const skills = listSkills().filter((s) => s.category === 'engineering');
      expect(skills).toHaveLength(10);
    });

    it('should register 10 data skills', () => {
      const skills = listSkills().filter((s) => s.category === 'data');
      expect(skills).toHaveLength(10);
    });

    it('should register 9 sales skills', () => {
      const skills = listSkills().filter((s) => s.category === 'sales');
      expect(skills).toHaveLength(9);
    });

    it('should register 9 product skills', () => {
      const skills = listSkills().filter((s) => s.category === 'product');
      expect(skills).toHaveLength(9);
    });

    it('should register 10 engineering skills', () => {
      const skills = listSkills().filter((s) => s.category === 'engineering');
      expect(skills).toHaveLength(10);
    });

    it('should register 10 data skills', () => {
      const skills = listSkills().filter((s) => s.category === 'data');
      expect(skills).toHaveLength(10);
    });

    it('should register 9 sales skills', () => {
      const skills = listSkills().filter((s) => s.category === 'sales');
      expect(skills).toHaveLength(9);
    });

    it('should register 9 product skills', () => {
      const skills = listSkills().filter((s) => s.category === 'product');
      expect(skills).toHaveLength(9);
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

  describe('Sales Skills', () => {
    it('should have /account-research skill', () => {
      const skill = getSkill('/account-research');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Account Research');
      expect(skill?.category).toBe('sales');
    });

    it('should have /call-prep skill', () => {
      const skill = getSkill('/call-prep');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Call Prep');
      expect(skill?.category).toBe('sales');
    });

    it('should have /forecast skill', () => {
      const skill = getSkill('/forecast');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Forecast');
      expect(skill?.category).toBe('sales');
    });
  });

  describe('Product Management Skills', () => {
    it('should have /write-spec skill', () => {
      const skill = getSkill('/write-spec');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Write Spec');
      expect(skill?.category).toBe('product');
    });

    it('should have /roadmap-update skill', () => {
      const skill = getSkill('/roadmap-update');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Roadmap Update');
      expect(skill?.category).toBe('product');
    });

    it('should have /stakeholder-update skill', () => {
      const skill = getSkill('/stakeholder-update');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Stakeholder Update');
      expect(skill?.category).toBe('product');
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
      const { renderTemplate } = require('../framework.js');

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
