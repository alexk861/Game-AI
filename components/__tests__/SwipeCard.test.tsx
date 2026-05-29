import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import SwipeCard from '../SwipeCard';

describe('SwipeCard Component', () => {
  it('renders photo capture elements', () => {
    render(
      <SwipeCard
        imageUrl="/test-image.jpg"
        onSwipe={() => {}}
        disabled={false}
      />
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('initially applies quiet physical transitions and default scale properties', () => {
    const { container } = render(
      <SwipeCard
        imageUrl="/test-image.jpg"
        onSwipe={() => {}}
        disabled={false}
      />
    );
    const cardDiv = container.querySelector('.swipe-card') as HTMLElement;
    expect(cardDiv).toBeInTheDocument();
    
    // Default non-dragging scale is 1
    expect(cardDiv).toHaveStyle('scale: 1');
  });

  it('supports exit directions with standard classes', () => {
    const { container } = render(
      <SwipeCard
        imageUrl="/test-image.jpg"
        onSwipe={() => {}}
        disabled={false}
      />
    );

    const cardDiv = container.querySelector('.swipe-card') as HTMLElement;
    expect(cardDiv).not.toHaveClass('swipe-card-exit-left');
  });
});
