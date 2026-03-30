import { fireEvent, render, screen } from '@testing-library/react';
import { LogViewer } from '../LogViewer';
import { sampleLogs } from '../__fixtures__/dashboard';
import '@testing-library/jest-dom';

describe('LogViewer', () => {
  it('renders log messages', () => {
    render(<LogViewer logs={sampleLogs} />);

    expect(screen.getByText('Live Log Viewer')).toBeInTheDocument();
    expect(screen.getByText('Agent boot complete')).toBeInTheDocument();
    expect(screen.getByText('Provider timeout detected')).toBeInTheDocument();
  });

  it('filters by severity level', () => {
    render(<LogViewer logs={sampleLogs} />);

    fireEvent.change(screen.getByDisplayValue('All levels'), {
      target: { value: 'error' },
    });

    expect(screen.queryByText('Agent boot complete')).not.toBeInTheDocument();
    expect(screen.getByText('Provider timeout detected')).toBeInTheDocument();
  });
});
