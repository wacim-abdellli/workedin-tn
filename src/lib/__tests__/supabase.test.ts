import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient, setMockData, setMockError, resetMocks } from '@/test/mocks/supabase';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabaseClient,
}));

describe('Supabase Client', () => {
    beforeEach(() => {
        resetMocks();
        vi.clearAllMocks();
    });

    describe('Query Builder', () => {
        it('should create query builder with from()', async () => {
            const builder = mockSupabaseClient.from('profiles');
            expect(builder).toBeDefined();
            expect(typeof builder.select).toBe('function');
            expect(typeof builder.eq).toBe('function');
            expect(typeof builder.single).toBe('function');
        });

        it('should chain query methods', async () => {
            const builder = mockSupabaseClient
                .from('profiles')
                .select('*')
                .eq('id', 'test-id');

            expect(builder).toBeDefined();
        });

        it('should return mock data with select', async () => {
            setMockData('jobs', [
                { id: 'job-1', title: 'Test Job', status: 'open' },
                { id: 'job-2', title: 'Another Job', status: 'closed' },
            ]);

            const result = await mockSupabaseClient
                .from('jobs')
                .select('*');

            expect(result.data).toHaveLength(2);
            expect(result.error).toBeNull();
        });

        it('should filter data with eq()', async () => {
            setMockData('jobs', [
                { id: 'job-1', title: 'Test Job', status: 'open' },
                { id: 'job-2', title: 'Another Job', status: 'closed' },
            ]);

            const result = await mockSupabaseClient
                .from('jobs')
                .select('*')
                .eq('status', 'open');

            expect(result.data).toHaveLength(1);
            expect(result.data?.[0]?.id).toBe('job-1');
        });

        it('should return single record', async () => {
            setMockData('profiles', [
                { id: 'user-1', full_name: 'Test User' },
            ]);

            const result = await mockSupabaseClient
                .from('profiles')
                .select('*')
                .eq('id', 'user-1')
                .single();

            expect(result.data).toBeDefined();
            expect(result.data?.id).toBe('user-1');
            expect(result.error).toBeNull();
        });

        it('should return error for single when no match', async () => {
            setMockData('profiles', []);

            const result = await mockSupabaseClient
                .from('profiles')
                .select('*')
                .eq('id', 'non-existent')
                .single();

            expect(result.data).toBeNull();
            expect(result.error).toBeDefined();
            expect(result.error?.code).toBe('PGRST116');
        });

        it('should handle mock errors', async () => {
            setMockError({ message: 'Database error', code: 'DB_ERROR' });

            const result = await mockSupabaseClient
                .from('profiles')
                .select('*');

            expect(result.data).toBeNull();
            expect(result.error?.message).toBe('Database error');
        });
    });

    describe('Insert Operations', () => {
        it('should insert new records', async () => {
            setMockData('jobs', []);

            const result = await mockSupabaseClient
                .from('jobs')
                .insert({ title: 'New Job', status: 'open' });

            expect(result.data).toBeDefined();
            expect(result.data?.[0]?.title).toBe('New Job');
            expect(result.error).toBeNull();
        });

        it('should insert multiple records', async () => {
            setMockData('jobs', []);

            const result = await mockSupabaseClient
                .from('jobs')
                .insert([
                    { title: 'Job 1', status: 'open' },
                    { title: 'Job 2', status: 'open' },
                ]);

            expect(result.data).toHaveLength(2);
        });
    });

    describe('Update Operations', () => {
        it('should update existing records', async () => {
            setMockData('profiles', [
                { id: 'user-1', full_name: 'Old Name' },
            ]);

            const result = await mockSupabaseClient
                .from('profiles')
                .update({ full_name: 'New Name' })
                .eq('id', 'user-1');

            expect(result.data?.[0]?.full_name).toBe('New Name');
            expect(result.error).toBeNull();
        });
    });

    describe('Delete Operations', () => {
        it('should delete records', async () => {
            setMockData('jobs', [
                { id: 'job-1', title: 'To Delete' },
                { id: 'job-2', title: 'To Keep' },
            ]);

            const result = await mockSupabaseClient
                .from('jobs')
                .delete()
                .eq('id', 'job-1');

            expect(result.data).toHaveLength(1);
            expect(result.data?.[0]?.id).toBe('job-1');
        });
    });

    describe('Auth Methods', () => {
        it('should mock getSession', async () => {
            const result = await mockSupabaseClient.auth.getSession();
            expect(result.data).toBeDefined();
            expect(result.error).toBeNull();
        });

        it('should mock signInWithPassword', async () => {
            const result = await mockSupabaseClient.auth.signInWithPassword({
                email: 'test@example.com',
                password: 'password',
            });

            expect(result.error).toBeNull();
        });

        it('should mock signUp', async () => {
            const result = await mockSupabaseClient.auth.signUp({
                email: 'new@example.com',
                password: 'password123',
            });

            expect(result.error).toBeNull();
        });

        it('should mock signOut', async () => {
            const result = await mockSupabaseClient.auth.signOut();
            expect(result.error).toBeNull();
        });

        it('should mock onAuthStateChange', () => {
            const callback = vi.fn();
            const result = mockSupabaseClient.auth.onAuthStateChange(callback);

            expect(result.data.subscription).toBeDefined();
            expect(typeof result.data.subscription.unsubscribe).toBe('function');
        });
    });

    describe('Storage Methods', () => {
        it('should mock storage upload', async () => {
            const storage = mockSupabaseClient.storage.from('avatars');
            const result = await storage.upload('path/file.png', new Blob());

            expect(result.data?.path).toBeDefined();
            expect(result.error).toBeNull();
        });

        it('should mock getPublicUrl', () => {
            const storage = mockSupabaseClient.storage.from('avatars');
            const result = storage.getPublicUrl('path/file.png');

            expect(result.data.publicUrl).toBeDefined();
        });
    });

    describe('Realtime', () => {
        it('should mock channel subscription', () => {
            const channel = mockSupabaseClient.channel('test-channel');

            expect(typeof channel.on).toBe('function');
            expect(typeof channel.subscribe).toBe('function');

            const subscription = channel
                .on('postgres_changes', { event: '*', schema: 'public' }, () => { })
                .subscribe();

            expect(subscription.status).toBe('SUBSCRIBED');
        });
    });
});
