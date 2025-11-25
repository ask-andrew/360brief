import { z } from 'zod'

export const AnalyticsQuerySchema = z.object({
  daysBack: z.preprocess(
    (v) => {
      if (v == null) return undefined
      const n = typeof v === 'string' ? Number(v) : v
      return Number.isFinite(n) ? Number(n) : undefined
    },
    z.number().int().min(1).max(30).default(7)
  ),
  useMock: z.preprocess(
    (v) => v === 'true' || v === true,
    z.boolean().default(false)
  ),
  useRealData: z.preprocess(
    (v) => !(v === 'false' || v === false),
    z.boolean().default(true)
  ),
})

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>
