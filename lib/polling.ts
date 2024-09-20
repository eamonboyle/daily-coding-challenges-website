export async function pollForResult<T>(
    fetchFn: () => Promise<T>,
    isComplete: (result: T) => boolean,
    maxAttempts = 10,
    interval = 2000
): Promise<T> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await fetchFn()
        if (isComplete(result)) {
            return result
        }
        await new Promise((resolve) => setTimeout(resolve, interval))
    }
    throw new Error("Polling timeout")
}
