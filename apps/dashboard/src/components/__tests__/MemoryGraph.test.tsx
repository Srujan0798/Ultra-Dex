import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryGraph } from '../MemoryGraph';
import { sampleMemory } from '../__fixtures__/dashboard';

describe('MemoryGraph', () => {
  it('renders graph controls and counters', () => {
    render(<MemoryGraph memory={sampleMemory} />);

    expect(screen.getByText('Memory Relationship Graph')).toBeInTheDocument();
    expect(screen.getByText(/Timeline window/i)).toBeInTheDocument();
    expect(screen.getByText('Total nodes')).toBeInTheDocument();
  });

  it('filters by tier', () => {
    render(<MemoryGraph memory={sampleMemory} />);

    fireEvent.change(screen.getByDisplayValue('All tiers'), { target: { value: 'hot' } });

    expect(screen.getByText('Hot tier')).toBeInTheDocument();
  });
});
