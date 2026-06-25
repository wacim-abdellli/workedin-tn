import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders with primary variant by default', () => {
        render(<Button>Primary</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-emerald-600');
    });

    it('renders with correct variant classes', () => {
        const { rerender } = render(<Button variant="danger">Danger</Button>);
        expect(screen.getByRole('button').className).toContain('bg-[var(--color-status-error,#ef4444)]');

        rerender(<Button variant="ghost">Ghost</Button>);
        expect(screen.getByRole('button').className).toContain('bg-transparent');
    });

    it('renders with correct size classes', () => {
        const { rerender } = render(<Button size="xs">Small</Button>);
        expect(screen.getByRole('button').className).toContain('text-xs');

        rerender(<Button size="xl">Extra large</Button>);
        expect(screen.getByRole('button').className).toContain('text-lg');
    });

    it('disables the button when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disables the button and shows spinner when isLoading is true', () => {
        render(<Button isLoading>Loading</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('does not render children when isLoading', () => {
        render(<Button isLoading>Loading content</Button>);
        expect(screen.queryByText('Loading content')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Click</Button>);

        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Button disabled onClick={onClick}>Click</Button>);

        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when isLoading', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<Button isLoading onClick={onClick}>Click</Button>);

        await user.click(screen.getByRole('button'));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('renders leftIcon when provided', () => {
        render(<Button leftIcon={<span data-testid="icon">★</span>}>With icon</Button>);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders rightIcon when provided', () => {
        render(<Button rightIcon={<span data-testid="icon">→</span>}>With icon</Button>);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('hides icons when isLoading', () => {
        render(
            <Button isLoading leftIcon={<span data-testid="left">★</span>} rightIcon={<span data-testid="right">→</span>}>
                Loading
            </Button>
        );
        expect(screen.queryByTestId('left')).not.toBeInTheDocument();
        expect(screen.queryByTestId('right')).not.toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
        const ref = { current: null };
        render(<Button ref={ref}>Ref test</Button>);
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('passes additional props to button element', () => {
        render(<Button type="submit" data-testid="custom">Submit</Button>);
        const button = screen.getByTestId('custom');
        expect(button).toHaveAttribute('type', 'submit');
    });
});
