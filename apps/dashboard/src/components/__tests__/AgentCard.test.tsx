import { fireEvent, render, screen } from '@testing-library/react';
import { AgentCard } from '../AgentCard';
import { sampleAgent } from '../__fixtures__/dashboard';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

describe('AgentCard', () => {
  it('renders agent identity and status', () => {
    const { container } = render(<AgentCard agent={sampleAgent} />);

    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(container.querySelector('.bg-emerald-400')).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('triggers quick action callbacks', () => {
    const onAction = vi.fn();
    render(<AgentCard agent={sampleAgent} onAction={onAction} />);

    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: /stop/i }));
    fireEvent.click(screen.getByRole('button', { name: /logs/i }));

    expect(onAction).toHaveBeenNthCalledWith(1, sampleAgent.id, 'start');
    expect(onAction).toHaveBeenNthCalledWith(2, sampleAgent.id, 'stop');
    expect(onAction).toHaveBeenNthCalledWith(3, sampleAgent.id, 'logs');
  });
});
