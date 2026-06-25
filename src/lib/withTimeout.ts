/**
 * Races a promise against a timeout. Rejects if the timeout fires first.
 */
export async function withTimeout<T>(
    promise: PromiseLike<T>,
    timeoutMs: number = 15000,
    operationName: string = 'Operation'
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}
