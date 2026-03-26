import { vi } from 'vitest';

// ============================================================================
// Mock Types
// ============================================================================

type MockUser = { id: string; email?: string; phone?: string } | null;
type MockSession = { user: MockUser; access_token: string } | null;
type MockError = { message: string; code: string } | null;

interface MockQueryResult<T> {
    data: T | null;
    error: MockError;
    count?: number;
}

// ============================================================================
// Mock State & Configuration
// ============================================================================

let mockData: Record<string, any[]> = {};
let mockError: MockError = null;
let mockUser: MockUser = null;
let mockSession: MockSession = null;

/**
 * Set mock data for a specific table.
 */
export const setMockData = <T>(table: string, data: T[]): void => {
    mockData[table] = data;
};

/**
 * Set a mock error to be returned by queries.
 */
export const setMockError = (error: MockError): void => {
    mockError = error;
};

/**
 * Set mock authenticated user.
 */
export const setMockUser = (user: MockUser): void => {
    mockUser = user;
    mockSession = user ? { user, access_token: 'mock-token' } : null;
};

/**
 * Reset all mock state.
 */
export const resetMocks = (): void => {
    mockData = {};
    mockError = null;
    mockUser = null;
    mockSession = null;
};

// ============================================================================
// Mock Query Builder
// ============================================================================

function createMockQueryBuilder<T = any>(tableName: string) {
    const filters: Array<{ column: string; value: any; operator: string }> = [];
    let insertData: any;
    let updateData: any;
    let isDelete = false;
    let orderColumn: string | undefined;
    let orderAscending = true;
    let limitCount: number | undefined;
    let rangeFrom: number | undefined;
    let rangeTo: number | undefined;

    const applyFilters = (data: any[]): any[] => {
        return data.filter((item: any) => {
            return filters.every(filter => {
                const itemValue = item[filter.column];
                switch (filter.operator) {
                    case 'eq':
                        return itemValue === filter.value;
                    case 'neq':
                        return itemValue !== filter.value;
                    case 'gt':
                        return itemValue > filter.value;
                    case 'gte':
                        return itemValue >= filter.value;
                    case 'lt':
                        return itemValue < filter.value;
                    case 'lte':
                        return itemValue <= filter.value;
                    case 'like':
                    case 'ilike':
                        return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase().replace(/%/g, ''));
                    case 'in':
                        return (filter.value as any[]).includes(itemValue);
                    case 'contains':
                        return Array.isArray(itemValue) && itemValue.includes(filter.value);
                    default:
                        return true;
                }
            });
        });
    };

    const builder = {
        select: () => builder,
        single: async (): Promise<MockQueryResult<T>> => {
            if (mockError) {
                return { data: null, error: mockError };
            }
            const tableData = mockData[tableName] || [];
            const filtered = applyFilters(tableData);
            return {
                data: filtered[0] || null,
                error: filtered.length === 0 ? { message: 'No rows found', code: 'PGRST116' } : null,
            };
        },
        eq: (column: string, value: any) => {
            filters.push({ column, value, operator: 'eq' });
            return builder;
        },
        neq: (column: string, value: any) => {
            filters.push({ column, value, operator: 'neq' });
            return builder;
        },
        gt: (column: string, value: any) => {
            filters.push({ column, value, operator: 'gt' });
            return builder;
        },
        gte: (column: string, value: any) => {
            filters.push({ column, value, operator: 'gte' });
            return builder;
        },
        lt: (column: string, value: any) => {
            filters.push({ column, value, operator: 'lt' });
            return builder;
        },
        lte: (column: string, value: any) => {
            filters.push({ column, value, operator: 'lte' });
            return builder;
        },
        like: (column: string, value: string) => {
            filters.push({ column, value, operator: 'like' });
            return builder;
        },
        ilike: (column: string, value: string) => {
            filters.push({ column, value, operator: 'ilike' });
            return builder;
        },
        in: (column: string, values: any[]) => {
            filters.push({ column, value: values, operator: 'in' });
            return builder;
        },
        contains: (column: string, value: any) => {
            filters.push({ column, value, operator: 'contains' });
            return builder;
        },
        order: (column: string, options: { ascending?: boolean } = {}) => {
            orderColumn = column;
            orderAscending = options.ascending !== false;
            return builder;
        },
        limit: (count: number) => {
            limitCount = count;
            return builder;
        },
        range: (from: number, to: number) => {
            rangeFrom = from;
            rangeTo = to;
            return builder;
        },
        insert: (data: any) => {
            insertData = data;
            return builder;
        },
        update: (data: any) => {
            updateData = data;
            return builder;
        },
        delete: () => {
            isDelete = true;
            return builder;
        },
        upsert: (data: any) => {
            insertData = data;
            return builder;
        },
        then: async <TResult>(onfulfilled?: (value: MockQueryResult<T[]>) => TResult): Promise<TResult | MockQueryResult<T[]>> => {
            if (mockError) {
                const result: MockQueryResult<T[]> = { data: null, error: mockError };
                return onfulfilled ? onfulfilled(result) : result;
            }

            const tableData = mockData[tableName] || [];

            // Handle insert
            if (insertData) {
                const newItems = Array.isArray(insertData) ? insertData : [insertData];
                const itemsWithIds = newItems.map((item, i) => ({
                    id: `mock-id-${Date.now()}-${i}`,
                    created_at: new Date().toISOString(),
                    ...item,
                }));
                mockData[tableName] = [...tableData, ...itemsWithIds];
                const result: MockQueryResult<T[]> = { data: itemsWithIds as T[], error: null };
                return onfulfilled ? onfulfilled(result) : result;
            }

            // Handle update
            if (updateData) {
                const filtered = applyFilters(tableData);
                const updatedItems = filtered.map((item: any) => ({ ...item, ...updateData }));
                mockData[tableName] = tableData.map((item: any) => {
                    const updated = updatedItems.find((u: any) => u.id === item.id);
                    return updated || item;
                });
                const result: MockQueryResult<T[]> = { data: updatedItems as T[], error: null };
                return onfulfilled ? onfulfilled(result) : result;
            }

            // Handle delete
            if (isDelete) {
                const filtered = applyFilters(tableData);
                const ids = filtered.map((item: any) => item.id);
                mockData[tableName] = tableData.filter((item: any) => !ids.includes(item.id));
                const result: MockQueryResult<T[]> = { data: filtered as T[], error: null };
                return onfulfilled ? onfulfilled(result) : result;
            }

            // Apply filters for select
            let result = applyFilters(tableData);

            // Apply ordering
            if (orderColumn) {
                const col = orderColumn;
                result = result.sort((a: any, b: any) => {
                    const aVal = a[col];
                    const bVal = b[col];
                    if (orderAscending) {
                        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    }
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                });
            }

            // Apply range/limit
            if (rangeFrom !== undefined && rangeTo !== undefined) {
                result = result.slice(rangeFrom, rangeTo + 1);
            } else if (limitCount !== undefined) {
                result = result.slice(0, limitCount);
            }

            const queryResult: MockQueryResult<T[]> = { data: result as T[], error: null };
            return onfulfilled ? onfulfilled(queryResult) : queryResult;
        },
    };

    return builder;
}

// ============================================================================
// Mock Supabase Client
// ============================================================================

export const mockSupabaseClient = {
    from: vi.fn((table: string) => createMockQueryBuilder(table)),

    auth: {
        getSession: vi.fn(async () => ({
            data: { session: mockSession },
            error: null,
        })),
        getUser: vi.fn(async () => ({
            data: { user: mockUser },
            error: null,
        })),
        signInWithOtp: vi.fn(async () => ({
            data: { user: mockUser, session: mockSession },
            error: mockError,
        })),
        verifyOtp: vi.fn(async () => ({
            data: { user: mockUser, session: mockSession },
            error: mockError,
        })),
        signOut: vi.fn(async () => {
            mockUser = null;
            mockSession = null;
            return { error: null };
        }),
        signUp: vi.fn(async () => ({
            data: { user: mockUser, session: mockSession },
            error: mockError,
        })),
        signInWithPassword: vi.fn(async () => ({
            data: { user: mockUser, session: mockSession },
            error: mockError,
        })),
        onAuthStateChange: vi.fn((callback: any) => {
            // Immediately call with current state
            callback('INITIAL_SESSION', mockSession);
            return {
                data: {
                    subscription: {
                        unsubscribe: vi.fn(),
                    },
                },
            };
        }),
        updateUser: vi.fn(async () => ({
            data: { user: mockUser },
            error: null,
        })),
        resetPasswordForEmail: vi.fn(async () => ({
            data: {},
            error: null,
        })),
    },

    storage: {
        from: vi.fn(() => ({
            upload: vi.fn(async () => ({
                data: { path: 'mock-path' },
                error: null,
            })),
            download: vi.fn(async () => ({
                data: new Blob(),
                error: null,
            })),
            remove: vi.fn(async () => ({
                data: [{ name: 'deleted-file' }],
                error: null,
            })),
            getPublicUrl: vi.fn(() => ({
                data: { publicUrl: 'https://example.com/mock-file.png' },
            })),
            list: vi.fn(async () => ({
                data: [],
                error: null,
            })),
        })),
    },

    channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(() => ({ status: 'SUBSCRIBED' })),
        unsubscribe: vi.fn(),
    })),

    removeChannel: vi.fn(),
};

// ============================================================================
// Mock Module Factory
// ============================================================================

/**
 * Call this in your test file to mock the supabase module.
 * 
 * Example:
 * ```ts
 * vi.mock('@/lib/supabase', () => ({
 *   supabase: mockSupabaseClient,
 * }));
 * ```
 */
export const createSupabaseMock = () => ({
    supabase: mockSupabaseClient,
});

export default mockSupabaseClient;
