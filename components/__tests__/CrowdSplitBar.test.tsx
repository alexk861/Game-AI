import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CrowdSplitBar from '../CrowdSplitBar';

describe('CrowdSplitBar Component', () => {
  it('shows the majority label for an AI answer and the fooled share', () => {
    render(<CrowdSplitBar guessesAi={62} guessesReal={38} answer="ai" />);
    expect(screen.getByText('62% SAID AI')).toBeInTheDocument();
    expect(screen.getByText('38% WERE FOOLED')).toBeInTheDocument();
  });

  it('counts the fooled share as those who guessed against a real answer', () => {
    render(<CrowdSplitBar guessesAi={30} guessesReal={70} answer="real" />);
    expect(screen.getByText('70% SAID REAL')).toBeInTheDocument();
    expect(screen.getByText('30% WERE FOOLED')).toBeInTheDocument();
  });

  it('rounds percentages from raw guess counts', () => {
    render(<CrowdSplitBar guessesAi={1} guessesReal={2} answer="ai" />);
    expect(screen.getByText('33% SAID AI')).toBeInTheDocument();
    expect(screen.getByText('67% WERE FOOLED')).toBeInTheDocument();
  });

  it('falls back to a NO CONSENSUS state with zero guesses', () => {
    render(<CrowdSplitBar guessesAi={0} guessesReal={0} answer="ai" />);
    expect(screen.getByText('NO CONSENSUS YET')).toBeInTheDocument();
  });
});
