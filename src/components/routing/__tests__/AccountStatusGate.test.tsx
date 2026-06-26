import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const showToastMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());
const supabaseWithRetryMock = vi.hoisted(() => vi.fn());

const authState = vi.hoisted(() => ({
  user: {
    id: 'user-1',
    email: 'user@example.com',
    user_metadata: { full_name: 'User Name' },
  },
  profile: {
    full_name: 'Profile Name',
    email: 'profile@example.com',
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('@/lib/supabaseWithRetry', () => ({
  supabaseWithRetry: supabaseWithRetryMock,
}));

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    tx: (_key: string, _opts?: unknown, fallback?: string) => fallback || _key,
  }),
}));

import AccountStatusGate from '@/components/routing/AccountStatusGate';

describe('AccountStatusGate support form', () => {
  beforeEach(() => {
    showToastMock.mockReset();
    fromMock.mockReset();
    insertMock.mockReset();
    supabaseWithRetryMock.mockReset();

    fromMock.mockReturnValue({
      insert: insertMock,
    });

    insertMock.mockResolvedValue({ data: null, error: null, status: 201 });
    supabaseWithRetryMock.mockImplementation(async (queryFn: () => Promise<unknown>) => queryFn());

    authState.user = {
      id: 'user-1',
      email: 'user@example.com',
      user_metadata: { full_name: 'User Name' },
    };
    authState.profile = {
      full_name: 'Profile Name',
      email: 'profile@example.com',
    };
  });

  it('submits a real support ticket for blocked accounts with optional subject', async () => {
    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    fireEvent.change(screen.getByPlaceholderText(/brief description of your issue/i), {
      target: { value: 'Urgent subject' },
    });
    fireEvent.change(screen.getByPlaceholderText(/your\.email@example\.com/i), {
      target: { value: 'custom-email@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/please describe your issue in detail/i), {
      target: { value: 'I need my account reviewed.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('support_tickets');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          account_status: 'suspended',
          name: 'Profile Name',
          email: 'custom-email@example.com',
          subject: 'Urgent subject',
          message: 'I need my account reviewed.',
          source: 'account_status_gate',
        })
      );
      expect(showToastMock).toHaveBeenCalledWith(
        'Your message has been sent successfully. We will get back to you soon.',
        'success'
      );
    });
  });

  it('renders correctly for suspended status', () => {
    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );
    expect(screen.getByText('Account suspended')).toBeInTheDocument();
    expect(screen.getByText(/Your account access is temporarily suspended/i)).toBeInTheDocument();
  });

  it('renders correctly for archived status', () => {
    render(
      <MemoryRouter>
        <AccountStatusGate status="archived" />
      </MemoryRouter>
    );
    expect(screen.getByText('Account archived')).toBeInTheDocument();
    expect(screen.getByText(/This account is archived and can no longer access protected platform features/i)).toBeInTheDocument();
  });

  it('falls back to user metadata full_name if profile name is missing', async () => {
    authState.profile = null as any;
    authState.user = {
      id: 'user-2',
      email: 'user2@example.com',
      user_metadata: { full_name: 'Metadata Full Name' },
    };

    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    const nameInput = screen.getByPlaceholderText(/enter your full name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/your\.email@example\.com/i) as HTMLInputElement;

    expect(nameInput.value).toBe('Metadata Full Name');
    expect(emailInput.value).toBe('user2@example.com');
  });

  it('falls back to user metadata name if profile name and metadata full_name are missing', async () => {
    authState.profile = null as any;
    authState.user = {
      id: 'user-3',
      email: 'user3@example.com',
      user_metadata: { name: 'Metadata Name' },
    };

    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    const nameInput = screen.getByPlaceholderText(/enter your full name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Metadata Name');
  });

  it('defaults to empty string if profile and user metadata name/email are missing', async () => {
    authState.profile = null as any;
    authState.user = null as any;

    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    const nameInput = screen.getByPlaceholderText(/enter your full name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/your\.email@example\.com/i) as HTMLInputElement;

    expect(nameInput.value).toBe('');
    expect(emailInput.value).toBe('');
  });

  it('blocks submit when required fields are missing', async () => {
    render(
      <MemoryRouter>
        <AccountStatusGate status="archived" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));
    
    // Clear name and email to trigger validation failure
    const nameInput = screen.getByPlaceholderText(/enter your full name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '' } });

    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith('Please fill in all required fields', 'error');
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  it('blocks submit and shows error if user session has expired', async () => {
    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    // Mock session expiration by removing user ID before submit
    authState.user = null as any;

    fireEvent.change(screen.getByPlaceholderText(/please describe your issue in detail/i), {
      target: { value: 'Session test' },
    });

    const form = document.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith('Your session has expired. Please sign in again.', 'error');
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  it('handles permission denied / RLS error during submission', async () => {
    supabaseWithRetryMock.mockRejectedValue(new Error('row-level security policy violation'));

    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    fireEvent.change(screen.getByPlaceholderText(/please describe your issue in detail/i), {
      target: { value: 'Help' },
    });

    const form = document.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        expect.stringContaining('Support request could not be submitted due to account permissions'),
        'error'
      );
      expect(showToastMock).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message'),
        'error'
      );
    });
  });

  it('handles generic submission errors', async () => {
    supabaseWithRetryMock.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    fireEvent.change(screen.getByPlaceholderText(/please describe your issue in detail/i), {
      target: { value: 'Help' },
    });

    const form = document.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message'),
        'error'
      );
      expect(showToastMock).not.toHaveBeenCalledWith(
        expect.stringContaining('Support request could not be submitted due to account permissions'),
        'error'
      );
    });
  });

  it('handles non-Error object rejection during submission', async () => {
    supabaseWithRetryMock.mockRejectedValue('Unknown error payload');

    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

    fireEvent.change(screen.getByPlaceholderText(/please describe your issue in detail/i), {
      target: { value: 'Help' },
    });

    const form = document.querySelector('form');
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send message'),
        'error'
      );
    });
  });

  it('can be closed via close button, cancel button, or background click', async () => {
    const { container } = render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    // 1. Close via close button (x)
    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();

    // 2. Close via cancel button
    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();

    // 3. Close via background overlay click
    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    
    // Find the overlay element and click it. The overlay has onClick event handlers.
    // The modal overlay is the parent container with bg-black/70 class.
    const overlay = screen.getByText('Contact Support').closest('.fixed');
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay as HTMLElement);
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
  });
});
