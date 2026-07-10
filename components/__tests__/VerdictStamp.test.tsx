import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerdictStamp from '../VerdictStamp';

describe('VerdictStamp Component', () => {
  it('renders the AI stamp with the wrong (unstable red) color classes', () => {
    render(<VerdictStamp answer="ai" />);
    const label = screen.getByText('AI-MADE');
    expect(label.className).toContain('border-wrong');
    expect(label.className).toContain('text-wrong');
  });

  it('renders the REAL stamp with the real (instrument gray) color classes', () => {
    render(<VerdictStamp answer="real" />);
    const label = screen.getByText('REAL PHOTO');
    expect(label.className).toContain('border-real');
    expect(label.className).toContain('text-real');
  });
});
