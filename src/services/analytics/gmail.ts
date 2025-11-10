import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import type { GmailMessage } from '@/types/analytics'
import { withRetry } from '@/services/analytics/retry'

export async function fetchGmailMessages(
  oauth: OAuth2Client,
  daysBack: number,
  maxResults: number = 100
): Promise<GmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth: oauth })

  // Do NOT use the 'q' parameter when the app only has Gmail metadata scope.
  // The metadata scope does not support server-side search with 'q'.
  const list = await withRetry(async () =>
    gmail.users.messages.list({
      userId: 'me',
      maxResults,
      // No 'q' here; callers should filter after fetching metadata if needed
      includeSpamTrash: false,
    })
  )

  const items = list.data.messages || []
  if (items.length === 0) return []

  // Hydrate messages with metadata headers and timestamps using 'metadata' format
  // to stay within the Gmail metadata scope. Add a modest cap and concurrency.
  const ids = items.slice(0, Math.min(maxResults, 200)).map((m) => m.id!).filter(Boolean)

  const concurrency = 5
  const results: GmailMessage[] = []
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency)
    // Fetch each message metadata in parallel within the small batch
    const fetched = await Promise.all(
      batch.map((id) =>
        withRetry(async () =>
          gmail.users.messages.get({
            userId: 'me',
            id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          })
        ).then((res) => res.data)
        .catch(() => null)
      )
    )

    for (const data of fetched) {
      if (!data) continue
      results.push({
        id: data.id || '',
        threadId: data.threadId || '',
        snippet: data.snippet ?? undefined,
        payload: {
          headers: (data.payload?.headers || []) as Array<{ name: string; value: string }>,
          parts: undefined,
        },
        internalDate: data.internalDate ?? undefined,
      })
    }
  }

  return results
}

