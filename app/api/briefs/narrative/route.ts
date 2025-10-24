// app/api/briefs/narrative/route.ts (root app dir, to ensure route registration)
import { NextResponse } from 'next/server'

const PRIMARY_URL = process.env.BRIEF_GENERATOR_URL || 'http://localhost:8000/generate-narrative-brief'
const FALLBACK_URL = 'http://localhost:8010/generate-narrative-brief'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: '/api/briefs/narrative' })
}

interface NarrativeBriefBody {
  emails?: any[]
  max_projects?: number
  include_clusters?: boolean
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NarrativeBriefBody

    if (!body || (!Array.isArray(body.emails) && body.emails !== undefined)) {
      return NextResponse.json({ error: 'Invalid payload: emails must be an array if provided.' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    const doFetch = async (url: string) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: body.emails ?? [],
        max_projects: body.max_projects ?? 8,
        include_clusters: body.include_clusters ?? true,
      }),
      signal: controller.signal,
    })

    let apiResponse: Response
    try {
      apiResponse = await doFetch(PRIMARY_URL)
      if (!apiResponse.ok) {
        const fb = await doFetch(FALLBACK_URL)
        apiResponse = fb
      }
    } catch {
      apiResponse = await doFetch(FALLBACK_URL)
    }

    clearTimeout(timeout)

    if (!apiResponse.ok) {
      const text = await apiResponse.text()
      return new NextResponse(text || 'Upstream error from brief generator.', { status: apiResponse.status })
    }

    const data = await apiResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'Brief generation timed out.' : 'Internal Server Error while generating brief.'
    console.error('Narrative Brief Proxy Error:', error)
    return new NextResponse(message, { status: 500 })
  }
}
