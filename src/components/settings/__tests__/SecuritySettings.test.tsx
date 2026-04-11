import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

const showToastMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const supabaseWithRetryMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const maybeSingleMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());

const authState = vi.hoisted(() => ({
  signOut: vi.fn(),
  user: {
    id: 'user-1',
    email: 'user@example.com',
    app_metadata: { provider: 'email' },
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
  supabaseWithRetry: supabaseWithRetryMock,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
    from: fromMock,
  },
}));

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    tx: (_key: string, _opts?: unknown, fallback?: string) => fallback || _key,
    t: {
      common: { cancel: 'Cancel' },
      auth: {
        password: {
          hide: 'Hide',
          show: 'Show',
        },
      },
    },
  }),
}));

vi.mock('@/components/ui/Button', () => ({
  default: ({
    children,
    onClick,
    disabled,
    type = 'button',
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }) => (
    <button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  default: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
  }) => (isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null),
}));

import SecuritySettings from '@/components/settings/SecuritySettings';

describe('SecuritySettings account deletion requests', () => {
  beforeEach(() => {
    showToastMock.mockReset();
    supabaseWithRetryMock.mockReset();
    fromMock.mockReset();
    maybeSingleMock.mockReset();
    insertMock.mockReset();

    const queryBuilder: any = {};
    queryBuilder.select = vi.fn(() => queryBuilder);
    queryBuilder.eq = vi.fn(() => queryBuilder);
    queryBuilder.in = vi.fn(() => queryBuilder);
    queryBuilder.limit = vi.fn(() => queryBuilder);
    queryBuilder.maybeSingle = maybeSingleMock;
    queryBuilder.insert = insertMock;

    fromMock.mockReturnValue(queryBuilder);

    supabaseWithRetryMock.mockImplementation(async (queryFn: () => Promise<unknown>) => queryFn());

    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    insertMock.mockResolvedValue({ data: null, error: null, status: 201 });
  });

  it('creates a deletion request when no active one exists', async () => {
    render(<SecuritySettings />);

    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete my account/i }));

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('account_deletion_requests');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          source: 'settings_security',
        })
      );
      expect(showToastMock).toHaveBeenCalledWith(
        'Your account deletion request was sent. It will be processed within 48 hours.',
        'info'
      );
    });
  });

  it('does not create duplicate requests when one is already open', async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: 'req-1', status: 'pending' },
      error: null,
    });

    render(<SecuritySettings />);

    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete my account/i }));

    await waitFor(() => {
      expect(insertMock).not.toHaveBeenCalled();
      expect(showToastMock).toHaveBeenCalledWith(
        'You already have an active account deletion request under review.',
        'info'
      );
    });
  });
});
