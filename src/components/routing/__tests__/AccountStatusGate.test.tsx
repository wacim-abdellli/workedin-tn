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

  it('submits a real support ticket for blocked accounts', async () => {
    render(
      <MemoryRouter>
        <AccountStatusGate status="suspended" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));

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
          email: 'profile@example.com',
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

  it('blocks submit when required fields are missing', async () => {
    render(
      <MemoryRouter>
        <AccountStatusGate status="archived" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /contact support/i }));
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith('Please fill in all required fields', 'error');
      expect(insertMock).not.toHaveBeenCalled();
    });
  });
});
