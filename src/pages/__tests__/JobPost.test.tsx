import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'test@test.com' },
  useAuth: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

const queryClientMocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  useQueryClient: vi.fn(),
}));

const autosaveMocks = vi.hoisted(() => ({
  loadFromStorage: vi.fn().mockReturnValue(null),
  clearStorage: vi.fn(),
  status: 'idle' as const,
  lastSaved: null as Date | null,
}));

const supabaseMocks = vi.hoisted(() => ({
  from: vi.fn(),
  uploadFile: vi.fn().mockResolvedValue('https://example.com/file.pdf'),
  getStorageConfigErrorMessage: vi.fn().mockReturnValue('Storage error'),
  supabaseWithRetry: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authMocks.useAuth(),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: toastMocks.showToast }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => queryClientMocks.useQueryClient(),
}));

vi.mock('@/hooks/useAutosave', () => ({
  useAutosave: () => ({
    status: autosaveMocks.status,
    lastSaved: autosaveMocks.lastSaved,
    loadFromStorage: autosaveMocks.loadFromStorage,
    clearStorage: autosaveMocks.clearStorage,
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: supabaseMocks.from },
  uploadFile: supabaseMocks.uploadFile,
  getStorageConfigErrorMessage: supabaseMocks.getStorageConfigErrorMessage,
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
  supabaseWithRetry: supabaseMocks.supabaseWithRetry,
}));

vi.mock('@/lib/dashboardQueries', () => ({
  dashboardQueryKeys: { clientStats: vi.fn().mockReturnValue(['client-stats']) },
  invalidateClientDashboardQueries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('@/components/common/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/layout', () => ({
  Header: () => <div>Header</div>,
}));

vi.mock('@/components/job-post/StepBudget', () => ({
  default: () => <div data-testid="step-budget">StepBudget</div>,
}));

vi.mock('@/components/job-post/StepVisibility', () => ({
  default: () => <div data-testid="step-visibility">StepVisibility</div>,
}));

vi.mock('@/components/job-post/StepReview', () => ({
  default: () => <div data-testid="step-review">StepReview</div>,
}));

vi.mock('@/components/job-post/JobLinksInput', () => ({
  default: ({ value, onChange }: { value: string[]; onChange: (links: string[]) => void }) => (
    <div>
      <span>JobLinksInput</span>
      <span data-testid="links-count">{value.length}</span>
      <button onClick={() => onChange([...value, 'https://example.com'])}>Add link</button>
    </div>
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  default: ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close modal</button>
        {children}
      </div>
    ) : null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
    useLocation: vi.fn().mockReturnValue({ state: null, pathname: '/jobs/new' }),
  };
});

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: {},
    tx: (_key: string, _params?: Record<string, string>, fallback?: string) => fallback ?? _key,
    language: 'en' as const,
    dir: 'ltr' as const,
    setLanguage: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import JobPost from '../JobPost';
import { useLocation } from 'react-router-dom';

function renderJobPost(initialState: Record<string, unknown> | null = null) {
  const mockedUseLocation = useLocation as ReturnType<typeof vi.fn>;
  mockedUseLocation.mockReturnValue({ state: initialState, pathname: '/jobs/new' });

  return render(
    <MemoryRouter initialEntries={['/jobs/new']}>
      <JobPost />
    </MemoryRouter>
  );
}

const fillStep1 = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText(/Modern bilingual logo/), 'Test Job Title Here');
  await user.selectOptions(screen.getByLabelText('Main category'), 'design');
  await user.selectOptions(screen.getByLabelText('Subcategory'), 'logo_design');
  await user.type(screen.getByPlaceholderText(/Provide detailed background/), 'A'.repeat(80));
  const skillInput = screen.getByPlaceholderText(/Try Graphic Design/);
  await user.type(skillInput, 'Re');
  const suggestedContainer = screen.getByText('Suggested:').parentElement!;
  const suggestedBtns = within(suggestedContainer).getAllByRole('button');
  if (suggestedBtns.length > 0) await user.click(suggestedBtns[0]);
};

describe('JobPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLElement.prototype.scrollIntoView = vi.fn();
    authMocks.useAuth.mockReturnValue({ user: authMocks.user });
    queryClientMocks.useQueryClient.mockReturnValue({
      invalidateQueries: queryClientMocks.invalidateQueries,
    });
    autosaveMocks.loadFromStorage.mockReturnValue(null);
    autosaveMocks.status = 'idle';
    autosaveMocks.lastSaved = null;
  });

  it('renders the job post form with step 1 visible', () => {
    renderJobPost();
    expect(screen.getByText('Post a Project')).toBeInTheDocument();
    expect(screen.getAllByText('Job details').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText(/Modern bilingual logo/)).toBeInTheDocument();
  });

  it('renders the sidebar with step navigation', () => {
    renderJobPost();
    expect(screen.getByText('CURRENT PHASE')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Expert Tips')).toBeInTheDocument();
  });

  it('renders the bottom navigation bar', () => {
    renderJobPost();
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
    expect(screen.getByText('Save draft')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  describe('Step navigation', () => {
    it('advances to step 2 when valid step 1 data is provided', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await fillStep1(user);
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Budget & Duration')).toBeInTheDocument();
    });

    it('goes back to step 1 from step 2', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await fillStep1(user);
      await user.click(screen.getByText('Next'));
      expect(screen.getByText('Budget & Duration')).toBeInTheDocument();
      await user.click(screen.getByText('Previous'));
      expect(screen.getAllByText('Job details').length).toBeGreaterThanOrEqual(1);
    });

    it('does not advance when step 1 validation fails', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await user.click(screen.getByText('Next'));
      expect(screen.getAllByText('Job details').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Title templates', () => {
    it('applies a title template when clicked', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const templateButton = screen.getByRole('button', { name: /Logo design for a food company/ });
      await user.click(templateButton);
      const input = screen.getByPlaceholderText(/Modern bilingual logo/) as HTMLInputElement;
      expect(input.value).toContain('Logo design');
    });
  });

  describe('Description snippets', () => {
    it('adds a description snippet when clicked', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const snippetBtn = screen.getByRole('button', { name: /Scope/ });
      await user.click(snippetBtn);
      const textarea = screen.getByPlaceholderText(/Provide detailed background/) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Scope');
    });

    it('appends snippet with newline when description already has content', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const textarea = screen.getByPlaceholderText(/Provide detailed background/);
      await user.type(textarea, 'Existing content');
      const snippetBtn = screen.getByRole('button', { name: /Deliverables/ });
      await user.click(snippetBtn);
      expect((textarea as HTMLTextAreaElement).value).toContain('Existing content');
      expect((textarea as HTMLTextAreaElement).value).toContain('Deliverables');
    });
  });

  describe('Skills management', () => {
    it('adds a skill from suggestions', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const skillInput = screen.getByPlaceholderText(/Try Graphic Design/);
      await user.type(skillInput, 'Re');
      const suggestedContainer = screen.getByText('Suggested:').parentElement!;
      const suggestedBtns = within(suggestedContainer).getAllByRole('button');
      expect(suggestedBtns.length).toBeGreaterThan(0);
      await user.click(suggestedBtns[0]);
      expect(screen.getByLabelText(/Remove/)).toBeInTheDocument();
    });

    it('removes a selected skill', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const skillInput = screen.getByPlaceholderText(/Try Graphic Design/);
      await user.type(skillInput, 'Re');
      const suggestedContainer = screen.getByText('Suggested:').parentElement!;
      const suggestedBtns = within(suggestedContainer).getAllByRole('button');
      expect(suggestedBtns.length).toBeGreaterThan(0);
      await user.click(suggestedBtns[0]);
      const removeBtn = screen.getByRole('button', { name: /Remove/ });
      await user.click(removeBtn);
      expect(screen.queryByLabelText(/Remove/)).not.toBeInTheDocument();
    });

    it('filters skills based on search query', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const skillInput = screen.getByPlaceholderText(/Try Graphic Design/);
      await user.type(skillInput, 'xyz_no_match');
      const suggestedContainer = screen.getByText('Suggested:').parentElement!;
      const suggestions = suggestedContainer.querySelectorAll('button');
      expect(suggestions.length).toBe(0);
    });
  });

  describe('File attachments', () => {
    it('renders the file upload area', () => {
      renderJobPost();
      expect(screen.getByText('Drag files here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose files')).toBeInTheDocument();
    });

    it('handles file input change', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.getElementById('attachments') as HTMLInputElement;
      await user.upload(input, file);
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('removes an attachment when remove button is clicked', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = document.getElementById('attachments') as HTMLInputElement;
      await user.upload(input, file);
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      const removeBtn = screen.getByLabelText('Remove test.pdf');
      await user.click(removeBtn);
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  describe('Category and subcategory', () => {
    it('resets subcategory when category changes', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const categorySelect = screen.getByLabelText('Main category');
      await user.selectOptions(categorySelect, 'design');
      const subcategorySelect = screen.getByLabelText('Subcategory');
      await user.selectOptions(subcategorySelect, 'logo_design');
      expect((subcategorySelect as HTMLSelectElement).value).toBe('logo_design');
      await user.selectOptions(categorySelect, 'development');
      expect((subcategorySelect as HTMLSelectElement).value).toBe('');
    });

    it('disables subcategory when no category is selected', () => {
      renderJobPost();
      const subcategorySelect = screen.getByLabelText('Subcategory');
      expect(subcategorySelect).toBeDisabled();
    });
  });

  describe('Quality score', () => {
    it('shows quality score indicator', () => {
      renderJobPost();
      expect(screen.getByText('Quality Score')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('shows quality checks list', () => {
      renderJobPost();
      expect(screen.getByText('Clear title')).toBeInTheDocument();
      expect(screen.getByText('Category selected')).toBeInTheDocument();
      expect(screen.getByText('Strong description')).toBeInTheDocument();
      expect(screen.getByText('Relevant skills')).toBeInTheDocument();
    });
  });

  describe('Draft management', () => {
    it('shows autosave status', () => {
      renderJobPost();
      expect(screen.getByText('Autosave ready')).toBeInTheDocument();
    });

    it('saves draft to localStorage when title is present', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await user.type(screen.getByPlaceholderText(/Modern bilingual logo/), 'My Draft Job');
      await user.click(screen.getByText('Save draft'));
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'workedin_job_draft',
        expect.any(String)
      );
      expect(toastMocks.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Draft saved'),
        'success'
      );
    });

    it('shows warning when trying to save draft without title', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await user.click(screen.getByText('Save draft'));
      expect(toastMocks.showToast).toHaveBeenCalledWith(
        expect.stringContaining('title'),
        'warning'
      );
    });

    it('restores draft from localStorage on mount when available', async () => {
      autosaveMocks.loadFromStorage.mockReturnValue({
        data: { title: 'Restored Draft', category: 'design' },
        timestamp: new Date(Date.now() - 60000),
      });
      renderJobPost();
      await waitFor(() => {
        expect(screen.getByDisplayValue('Restored Draft')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('restores draft data when restore button is clicked', async () => {
      const user = userEvent.setup();
      autosaveMocks.loadFromStorage.mockReturnValue({
        data: { title: 'Restored Title', category: 'design', subcategory: 'logo_design' },
        timestamp: new Date(Date.now() - 120000),
      });
      renderJobPost();
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      }, { timeout: 3000 });
      const restoreBtn = within(screen.getByTestId('modal')).getByRole('button', { name: 'Restore draft' });
      await user.click(restoreBtn);
      expect(screen.getByDisplayValue('Restored Title')).toBeInTheDocument();
    });

    it('discards draft when start fresh is clicked', async () => {
      const user = userEvent.setup();
      autosaveMocks.loadFromStorage.mockReturnValue({
        data: { title: 'Old Draft' },
        timestamp: new Date(Date.now() - 120000),
      });
      renderJobPost();
      await waitFor(() => {
        expect(screen.getByText('Start fresh')).toBeInTheDocument();
      }, { timeout: 3000 });
      await user.click(screen.getByText('Start fresh'));
      expect(autosaveMocks.clearStorage).toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    it('validates step 1 fields before advancing', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await user.click(screen.getByText('Next'));
      expect(screen.getByText(/Step 1/)).toBeInTheDocument();
    });
  });

  describe('Expert tips', () => {
    it('shows step 1 tips on step 1', () => {
      renderJobPost();
      expect(screen.getByText(/Specific Title:/)).toBeInTheDocument();
      expect(screen.getByText(/Rich Context:/)).toBeInTheDocument();
    });
  });

  describe('Progress indicator', () => {
    it('shows 25% progress on step 1', () => {
      renderJobPost();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  describe('Keyboard shortcut', () => {
    it('triggers save draft on Ctrl+S', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await user.type(screen.getByPlaceholderText(/Modern bilingual logo/), 'Draft Title');
      await user.keyboard('{Control>}s{/Control}');
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Drag and drop', () => {
    it('handles drag over event', () => {
      renderJobPost();
      const dropZone = screen.getByText('Drag files here or click to browse').closest('label')!;
      fireEvent.dragOver(dropZone);
    });

    it('handles drag leave event', () => {
      renderJobPost();
      const dropZone = screen.getByText('Drag files here or click to browse').closest('label')!;
      fireEvent.dragLeave(dropZone);
    });

    it('handles drop event with files', () => {
      renderJobPost();
      const dropZone = screen.getByText('Drag files here or click to browse').closest('label')!;
      const file = new File(['test'], 'dropped.pdf', { type: 'application/pdf' });
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
      expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
    });
  });

  describe('Character count', () => {
    it('shows character count for description', async () => {
      const user = userEvent.setup();
      renderJobPost();
      const textarea = screen.getByPlaceholderText(/Provide detailed background/);
      await user.type(textarea, 'Hello');
      expect(screen.getByText(/5 \/ 2000 characters/)).toBeInTheDocument();
    });
  });

  describe('Reference links', () => {
    it('renders the JobLinksInput component', () => {
      renderJobPost();
      expect(screen.getByText('JobLinksInput')).toBeInTheDocument();
    });
  });

  describe('Step rendering', () => {
    it('renders StepBudget component when on step 2', async () => {
      const user = userEvent.setup();
      renderJobPost();
      await fillStep1(user);
      await user.click(screen.getByText('Next'));
      expect(screen.getByTestId('step-budget')).toBeInTheDocument();
      expect(screen.getByText('Budget & Duration')).toBeInTheDocument();
    });
  });

  describe('Repost prefill', () => {
    it('prefills form from repost state', () => {
      const mockedUseLocation = useLocation as ReturnType<typeof vi.fn>;
      mockedUseLocation.mockReturnValue({
        state: {
          repostFromJob: {
            title: 'Reposted Job',
            category: 'design',
            subcategory: 'logo_design',
            job_type: 'fixed_price',
            description: 'Reposted description that is long enough to pass validation for the form.',
          },
        },
        pathname: '/jobs/new',
      });
      render(
        <MemoryRouter initialEntries={['/jobs/new']}>
          <JobPost />
        </MemoryRouter>
      );
      expect(screen.getByDisplayValue('Reposted Job')).toBeInTheDocument();
    });
  });

  describe('Draft prompt dismissed recently', () => {
    it('restores draft silently if dismissed recently', async () => {
      window.localStorage.getItem = vi.fn((key: string) => {
        if (key === 'workedin_job_restore_dismissed_at') return String(Date.now());
        return null;
      });
      autosaveMocks.loadFromStorage.mockReturnValue({
        data: { title: 'Silent Restore', category: 'design' },
        timestamp: new Date(Date.now() - 5000),
      });
      renderJobPost();
      await waitFor(() => {
        expect(screen.getByDisplayValue('Silent Restore')).toBeInTheDocument();
      });
    });
  });
});
