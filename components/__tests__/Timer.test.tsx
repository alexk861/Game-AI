import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import Timer from '../Timer';

describe('Timer Component', () => {
  it('renders countdown text correctly', () => {
    render(<Timer duration={10} running={true} onExpire={() => {}} />);
    expect(screen.getByText(/10s/i)).toBeInTheDocument();
  });

  it('renders neutral color progression initially', () => {
    const { container } = render(<Timer duration={10} running={false} onExpire={() => {}} />);
    const timerBar = container.querySelector('.timer-bar') as HTMLElement;
    expect(timerBar).toHaveStyle('background-color: var(--outline)');
  });

  it('transitions quietly to amber when time is under 4s', () => {
    const { container } = render(<Timer duration={3} running={false} onExpire={() => {}} />);
    const timerBar = container.querySelector('.timer-bar') as HTMLElement;
    expect(timerBar).toHaveStyle('background-color: var(--accent-amber)');
  });

  it('transitions quietly to muted red when time is under 2s', () => {
    const { container } = render(<Timer duration={1} running={false} onExpire={() => {}} />);
    const timerBar = container.querySelector('.timer-bar') as HTMLElement;
    expect(timerBar).toHaveStyle('background-color: var(--error)');
  });

  it('does not have any pulsing or shaking style attributes or classes', () => {
    render(<Timer duration={1} running={true} onExpire={() => {}} />);
    const textNode = screen.getByText(/1s/i);
    expect(textNode.className).not.toContain('timer-critical-shake');
    expect(textNode.className).not.toContain('timer-critical-pulse');
  });
});
