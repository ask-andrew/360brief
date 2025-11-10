export type RetryOptions = {
  retries?: number
  baseDelayMs?: number
  jitterRatio?: number
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3
  const base = opts.baseDelayMs ?? 500
  const jitter = opts.jitterRatio ?? 0.2

  let attempt = 0
  let lastErr: unknown

  while (attempt <= retries) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      if (attempt === retries) break
      const status = err?.code || err?.response?.status || err?.status
      // Do not retry on obvious auth errors without a refresh step handled by caller
      if (status === 401) break
      // Backoff with jitter
      const delay = Math.floor((base * 2 ** attempt) * (1 + (Math.random() - 0.5) * 2 * jitter))
      await sleep(delay)
      attempt += 1
    }
  }
  throw lastErr
}
