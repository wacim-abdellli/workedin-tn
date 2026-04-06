import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';
import { Skeleton, SkeletonGroup } from '../Skeleton';
import { ProgressBar, IndeterminateProgress } from '../ProgressBar';

describe('Loading Components', () => {
  describe('Spinner', () => {
    it('renders with default size', () => {
      render(<Spinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<Spinner size="xs" />);
      let spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-3', 'h-3');

      rerender(<Spinner size="xl" />);
      spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Skeleton', () => {
    it('renders with default variant', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('renders with circular variant', () => {
      render(<Skeleton variant="circular" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('renders with custom dimensions', () => {
      render(<Skeleton width="200px" height="100px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });
  });

  describe('SkeletonGroup', () => {
    it('renders multiple skeletons', () => {
      render(<SkeletonGroup count={3} />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(3);
    });

    it('renders children when provided', () => {
      render(
        <SkeletonGroup>
          <Skeleton />
          <Skeleton />
        </SkeletonGroup>
      );
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(2);
    });
  });

  describe('ProgressBar', () => {
    it('renders with correct progress value', () => {
      render(<ProgressBar value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('renders with label when showLabel is true', () => {
      render(<ProgressBar value={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<ProgressBar value={50} showLabel label="Uploading..." />);
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('clamps value between 0 and 100', () => {
      const { rerender } = render(<ProgressBar value={150} />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '150');

      rerender(<ProgressBar value={-10} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '-10');
    });
  });

  describe('IndeterminateProgress', () => {
    it('renders with correct aria attributes', () => {
      render(<IndeterminateProgress />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Loading');
      expect(progressBar).toHaveAttribute('aria-busy', 'true');
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<IndeterminateProgress size="sm" />);
      let container = screen.getByRole('progressbar');
      expect(container).toHaveClass('h-1');

      rerender(<IndeterminateProgress size="lg" />);
      container = screen.getByRole('progressbar');
      expect(container).toHaveClass('h-3');
    });
  });
});
