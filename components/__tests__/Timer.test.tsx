import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import Timer from '../Timer';

describe('Timer Component', () => {
  it('renders countdown text correctly', () => {
    render(<Timer duration={10} running={true} onExpire={() => {}} />);
    expect(screen.getByText(/10s/i)).toBeInTheDocument();
  });

  it('renders the neutral ring color initially', () => {
    const { container } = render(<Timer duration={10} running={false} onExpire={() => {}} />);
    const ring = container.querySelector('[data-testid="timer-ring"]') as HTMLElement;
    expect(ring.style.background).toContain('var(--text)');
    expect(ring.style.background).not.toContain('var(--wrong)');
  });

  it('shifts the ring to unstable red when time is under 4s', () => {
    const { container } = render(<Timer duration={3} running={false} onExpire={() => {}} />);
    const ring = container.querySelector('[data-testid="timer-ring"]') as HTMLElement;
    expect(ring.style.background).toContain('var(--wrong)');
  });

  it('keeps the ring red when time is under 2s (no amber tier)', () => {
    const { container } = render(<Timer duration={1} running={false} onExpire={() => {}} />);
    const ring = container.querySelector('[data-testid="timer-ring"]') as HTMLElement;
    expect(ring.style.background).toContain('var(--wrong)');
    expect(ring.style.background).not.toContain('var(--accent-amber)');
  });

  it('does not have any pulsing or shaking style attributes or classes', () => {
    render(<Timer duration={1} running={true} onExpire={() => {}} />);
    const textNode = screen.getByText(/1s/i);
    expect(textNode.className).not.toContain('timer-critical-shake');
    expect(textNode.className).not.toContain('timer-critical-pulse');
  });
});
