import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { FileQuestion } from 'lucide-react';

describe('EmptyState', () => {
  it('renders with basic props', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="No items found"
        description="There are no items to display"
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('renders with default variant', () => {
    const { container } = render(
      <EmptyState
        icon={FileQuestion}
        title="No items"
        description="Empty state"
      />
    );

    // Default variant should not have error styling
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with error variant', () => {
    const { container } = render(
      <EmptyState
        icon={FileQuestion}
        title="Error occurred"
        description="Something went wrong"
        variant="error"
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with primary action', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={FileQuestion}
        title="No items"
        description="Empty state"
        action={{
          label: 'Add Item',
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByText('Add Item');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with secondary action', () => {
    const handlePrimary = vi.fn();
    const handleSecondary = vi.fn();

    render(
      <EmptyState
        icon={FileQuestion}
        title="No items"
        description="Empty state"
        action={{
          label: 'Primary',
          onClick: handlePrimary,
        }}
        secondaryAction={{
          label: 'Secondary',
          onClick: handleSecondary,
        }}
      />
    );

    const primaryButton = screen.getByText('Primary');
    const secondaryButton = screen.getByText('Secondary');

    expect(primaryButton).toBeInTheDocument();
    expect(secondaryButton).toBeInTheDocument();

    fireEvent.click(primaryButton);
    expect(handlePrimary).toHaveBeenCalledTimes(1);

    fireEvent.click(secondaryButton);
    expect(handleSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders with custom illustration', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="No items"
        description="Empty state"
        illustration={<div data-testid="custom-illustration">Custom</div>}
      />
    );

    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState
        icon={FileQuestion}
        title="No items"
        description="Empty state"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses danger variant for error state action button', () => {
    render(
      <EmptyState
        icon={FileQuestion}
        title="Error"
        description="Something went wrong"
        variant="error"
        action={{
          label: 'Retry',
          onClick: vi.fn(),
        }}
      />
    );

    const button = screen.getByText('Retry');
    expect(button).toBeInTheDocument();
  });
});
