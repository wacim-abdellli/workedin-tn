import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
    Image: () => <svg data-testid="lucide-image" />,
    FileArchive: () => <svg data-testid="lucide-archive" />,
    FileCheck2: () => <svg data-testid="lucide-pdf" />,
    FileText: () => <svg data-testid="lucide-text" />,
    User: () => <svg data-testid="lucide-user" />,
}));

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        tx: (_key: string, _opts?: unknown, fallback?: string) => fallback || _key,
    }),
}));

import { GhostButton, DangerButton, FileIcon, CompactEmpty, PartyAvatar } from '../sidebarPrimitives';

describe('GhostButton', () => {
    it('renders with label and icon', () => {
        render(<GhostButton onClick={() => {}} icon={<span data-testid="icon">*</span>} label="Click me" />);
        expect(screen.getByText('Click me')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<GhostButton onClick={onClick} icon={<span>*</span>} label="Click" />);
        fireEvent.click(screen.getByText('Click'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('is disabled when disabled prop is true', () => {
        render(<GhostButton onClick={() => {}} icon={<span>*</span>} label="Disabled" disabled />);
        expect(screen.getByText('Disabled').closest('button')).toBeDisabled();
    });
});

describe('DangerButton', () => {
    it('renders with label and icon', () => {
        render(<DangerButton onClick={() => {}} icon={<span data-testid="icon">!</span>} label="Delete" />);
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<DangerButton onClick={onClick} icon={<span>!</span>} label="Delete" />);
        fireEvent.click(screen.getByText('Delete'));
        expect(onClick).toHaveBeenCalledOnce();
    });
});

describe('FileIcon', () => {
    it('renders image icon for png files', () => {
        const { container } = render(<FileIcon name="photo.png" />);
        expect(container.querySelector('[class*="amber"]')).toBeTruthy();
        expect(screen.getByTestId('lucide-image')).toBeInTheDocument();
    });

    it('renders image icon for image mime type', () => {
        const { container } = render(<FileIcon name="file" mimeType="image/jpeg" />);
        expect(container.querySelector('.text-amber-400')).toBeTruthy();
    });

    it('renders archive icon for zip files', () => {
        const { container } = render(<FileIcon name="archive.zip" />);
        expect(container.querySelector('.text-violet-400')).toBeTruthy();
    });

    it('renders pdf icon for pdf files', () => {
        const { container } = render(<FileIcon name="doc.pdf" />);
        expect(container.querySelector('.text-emerald-400')).toBeTruthy();
    });

    it('renders text icon for unknown file types', () => {
        const { container } = render(<FileIcon name="notes.txt" />);
        expect(container.querySelector('.text-sky-400')).toBeTruthy();
    });
});

describe('CompactEmpty', () => {
    it('renders title and text', () => {
        render(<CompactEmpty icon={<span data-testid="icon">*</span>} title="Nothing here" text="Add something" />);
        expect(screen.getByText('Nothing here')).toBeInTheDocument();
        expect(screen.getByText('Add something')).toBeInTheDocument();
    });
});

describe('PartyAvatar', () => {
    it('renders image when avatar_url is provided', () => {
        render(<PartyAvatar party={{ full_name: 'John', avatar_url: 'https://example.com/avatar.jpg' }} />);
        const img = screen.getByAltText('John');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('renders user icon when no avatar_url', () => {
        const { container } = render(<PartyAvatar party={{ full_name: 'John' }} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('renders user icon when party is null', () => {
        const { container } = render(<PartyAvatar party={null} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });
});
