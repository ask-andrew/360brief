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

  // Calculate the date range for filtering
  const afterDate = new Date()
  afterDate.setDate(afterDate.getDate() - daysBack)
  const afterTimestamp = Math.floor(afterDate.getTime() / 1000)
  
  console.log(`📧 Fetching Gmail messages from last ${daysBack} days (after ${afterDate.toISOString()})...`)

  // We use 'gmail.readonly' scope which allows reading full message content.
  // We list messages first, then fetch details.
  const list = await withRetry(async () =>
    gmail.users.messages.list({
      userId: 'me',
      maxResults,
      includeSpamTrash: false,
      q: `after:${afterTimestamp}`, // Filter by date
    })
  )

  const items = list.data.messages || []
  console.log(`📬 Found ${items.length} messages in the last ${daysBack} days`)
  
  if (items.length === 0) return []

  // Hydrate messages with full content for sentiment analysis.
  // We limit to maxResults (default 100, max 200 from route) to avoid timeouts.
  const ids = items.slice(0, Math.min(maxResults, 200)).map((m) => m.id!).filter(Boolean)

  const concurrency = 5
  const results: GmailMessage[] = []
  console.log(`🔄 Fetching details for ${ids.length} messages in batches of ${concurrency}...`)
  
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency)
    const batchNum = Math.floor(i / concurrency) + 1
    const totalBatches = Math.ceil(ids.length / concurrency)
    console.log(`  📦 Batch ${batchNum}/${totalBatches}: Fetching ${batch.length} messages...`)
    
    // Fetch each message in parallel within the small batch
    const fetched = await Promise.all(
      batch.map((id) =>
        withRetry(async () =>
          gmail.users.messages.get({
            userId: 'me',
            id,
            format: 'full', // Fetch full content for sentiment analysis
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
          parts: data.payload?.parts, // Include parts for body extraction
          body: data.payload?.body ? {
            data: data.payload.body.data ?? undefined,
            size: data.payload.body.size ?? undefined,
          } : undefined,
        },
        internalDate: data.internalDate ?? undefined,
      })
    }
    console.log(`  ✅ Batch ${batchNum}/${totalBatches} complete: ${fetched.filter(Boolean).length} messages fetched`)
  }
  
  console.log(`✅ Fetched ${results.length} total Gmail messages with full content`)
  return results
}
