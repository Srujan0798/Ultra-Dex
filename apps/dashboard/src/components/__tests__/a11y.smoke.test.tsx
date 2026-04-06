/// <reference types="vitest/globals" />

import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Header } from '../Header';
import { AgentCard } from '../AgentCard';
import { sampleAgent } from '../__fixtures__/dashboard';

describe('dashboard accessibility smoke checks', () => {
  it('header has no critical accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Header title="Mission Control" connected />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('agent card has no critical accessibility violations', async () => {
    const { container } = render(
      <AgentCard agent={sampleAgent} onAction={() => undefined} />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
