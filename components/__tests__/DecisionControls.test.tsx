import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import DecisionControls from '../DecisionControls';

describe('DecisionControls Component', () => {
  it('renders both choice buttons', () => {
    render(<DecisionControls disabled={false} onDecision={() => {}} />);
    expect(screen.getByText(/REAL/i)).toBeInTheDocument();
    expect(screen.getByText(/AI/i)).toBeInTheDocument();
  });

  it('triggers onDecision with real choice when clicking REAL button', () => {
    const handleDecision = vi.fn();
    render(<DecisionControls disabled={false} onDecision={handleDecision} />);
    
    act(() => {
      fireEvent.click(screen.getByText(/REAL/i).closest('button')!);
    });

    expect(handleDecision).toHaveBeenCalledWith('real');
  });

  it('triggers onDecision with ai choice when clicking AI button', () => {
    const handleDecision = vi.fn();
    render(<DecisionControls disabled={false} onDecision={handleDecision} />);

    act(() => {
      fireEvent.click(screen.getByText(/AI/i).closest('button')!);
    });

    expect(handleDecision).toHaveBeenCalledWith('ai');
  });

  it('has premium active scale and transition utilities configured in class names', () => {
    render(<DecisionControls disabled={false} onDecision={() => {}} />);
    const realButton = screen.getByText(/REAL/i).closest('button')!;
    expect(realButton.className).toContain('active:scale-[0.97]');
    expect(realButton.className).toContain('transition-all');
    expect(realButton.className).toContain('duration-300');
  });
});
