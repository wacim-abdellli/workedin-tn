import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminSelect from '../AdminSelect';

const options = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
];

describe('AdminSelect', () => {
    it('renders trigger with selected label', () => {
        render(<AdminSelect value="active" onChange={vi.fn()} options={options} />);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('shows raw value when no matching option', () => {
        render(<AdminSelect value="unknown" onChange={vi.fn()} options={options} />);
        expect(screen.getByText('unknown')).toBeInTheDocument();
    });

    it('opens dropdown on click', () => {
        render(<AdminSelect value="all" onChange={vi.fn()} options={options} />);
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('selects option and calls onChange', () => {
        const onChange = vi.fn();
        render(<AdminSelect value="all" onChange={onChange} options={options} />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('Active'));
        expect(onChange).toHaveBeenCalledWith('active');
    });

    it('closes dropdown after selection', () => {
        render(<AdminSelect value="all" onChange={vi.fn()} options={options} />);
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('Active'));
        expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });

    it('highlights selected option', () => {
        render(<AdminSelect value="pending" onChange={vi.fn()} options={options} />);
        fireEvent.click(screen.getByRole('button'));
        const optionsRendered = screen.getAllByRole('button');
        const pendingOption = optionsRendered.find(b => b.textContent === 'Pending');
        expect(pendingOption?.className).toContain('purple');
    });

    it('closes dropdown when clicking outside', () => {
        render(<AdminSelect value="all" onChange={vi.fn()} options={options} />);
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('Pending')).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });
});
