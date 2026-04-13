import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, ParseError, GraphError } from '../../dexgraph/parser.ts';
import { validateWorkflow } from '../../dexgraph/schema.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function writeTempDex(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dexgraph-test-'));
  const file = path.join(dir, 'workflow.dex');
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('DexGraph Parser', () => {
  describe('valid workflows', () => {
    it('parses examples/simple.dex successfully', () => {
      const result = parse('examples/simple.dex');
      assert.ok(result.nodes.length > 0);
      assert.ok(result.edges.length > 0);
      assert.equal(result.metadata.name, 'build-saas-backend');
    });

    it('returns correct node count', () => {
      const result = parse('examples/simple.dex');
      assert.equal(result.nodes.length, 5);
    });

    it('sets default parallel to false', () => {
      const result = parse('examples/simple.dex');
      const designSchema = result.nodes.find((n) => n.id === 'design-schema');
      assert.ok(designSchema);
      assert.equal(designSchema.parallel, false);
    });

    it('parses parallel flag when true', () => {
      const result = parse('examples/simple.dex');
      const setupProject = result.nodes.find((n) => n.id === 'setup-project');
      assert.ok(setupProject);
      assert.equal(setupProject.parallel, true);
    });

    it('extracts dependencies correctly', () => {
      const result = parse('examples/simple.dex');
      const implementAuth = result.nodes.find((n) => n.id === 'implement-auth');
      assert.ok(implementAuth);
      assert.deepEqual(
        implementAuth.dependencies.sort(),
        ['design-schema', 'setup-project'].sort()
      );
    });

    it('initializes nodes in CREATED state', () => {
      const result = parse('examples/simple.dex');
      for (const node of result.nodes) {
        assert.equal(node.state, 'CREATED');
      }
    });
  });

  describe('schema validation errors', () => {
    it('missing name throws', () => {
      const result = validateWorkflow({
        version: 'dexgraph/v1',
        name: '',
        tasks: [{ id: 't1', role: 'engineer', instruction: 'do something' }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('name')));
    });

    it('invalid role throws', () => {
      const result = validateWorkflow({
        version: 'dexgraph/v1',
        name: 'test',
        tasks: [{ id: 't1', role: 'manager', instruction: 'do something' }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('role')));
    });

    it('duplicate IDs throws', () => {
      const result = validateWorkflow({
        version: 'dexgraph/v1',
        name: 'test',
        tasks: [
          { id: 't1', role: 'engineer', instruction: 'first' },
          { id: 't1', role: 'tester', instruction: 'second' },
        ],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('Duplicate')));
    });

    it('unknown dep throws', () => {
      const file = writeTempDex(`
version: dexgraph/v1
name: test
tasks:
  - id: t1
    role: engineer
    instruction: do something
    depends_on:
      - nonexistent
`);
      assert.throws(() => parse(file), GraphError);
      fs.rmSync(path.dirname(file), { recursive: true });
    });

    it('self-dependency throws', () => {
      const result = validateWorkflow({
        version: 'dexgraph/v1',
        name: 'test',
        tasks: [{ id: 't1', role: 'engineer', instruction: 'do', depends_on: ['t1'] }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('itself')));
    });

    it('empty tasks throws', () => {
      const result = validateWorkflow({
        version: 'dexgraph/v1',
        name: 'test',
        tasks: [],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('at least one')));
    });

    it('invalid version throws', () => {
      const result = validateWorkflow({
        version: 'dexgraph/v0',
        name: 'test',
        tasks: [{ id: 't1', role: 'engineer', instruction: 'do' }],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('version')));
    });

    it('invalid verify type throws', () => {
      const result = validateWorkflow({
        version: 'dexgraph/v1',
        name: 'test',
        tasks: [
          {
            id: 't1',
            role: 'engineer',
            instruction: 'do',
            verify: { type: 'magic' },
          },
        ],
      });
      assert.equal(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('verify type')));
    });

    it('file not found throws ParseError', () => {
      assert.throws(() => parse('nonexistent/file.dex'), ParseError);
    });
  });

  describe('template resolution', () => {
    it('template refs create implicit edges', () => {
      const file = writeTempDex(`
version: dexgraph/v1
name: template-test
tasks:
  - id: producer
    role: engineer
    instruction: produce data
    output: data

  - id: consumer
    role: engineer
    instruction: consume {{producer.output}}
    depends_on:
      - producer
`);
      const result = parse(file);
      const consumer = result.nodes.find((n) => n.id === 'consumer');
      assert.ok(consumer);
      assert.ok(consumer.dependencies.includes('producer'));
      fs.rmSync(path.dirname(file), { recursive: true });
    });
  });
});
