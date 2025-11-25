import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export type SupabaseClientLike = {
  from: (table: string) => any
}

const TEN_MINUTES = 10 * 60 // seconds

export async function ensureValidAccessToken(supabase: SupabaseClientLike, userId: string) {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .limit(1)

  if (error) throw new Error(`Token query failed: ${error.message}`)

  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('No Google tokens found. Connect your Google account.')

  let accessToken: string | undefined = row.access_token as string | undefined
  const refreshToken: string | undefined = row.refresh_token as string | undefined
  const expiresAt = row.expires_at
    ? (typeof row.expires_at === 'string' ? Math.floor(new Date(row.expires_at).getTime() / 1000) : Number(row.expires_at))
    : undefined

  const now = Math.floor(Date.now() / 1000)
  const needsRefresh = !!refreshToken && (!!expiresAt ? (expiresAt < now + TEN_MINUTES) : true)

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  if (needsRefresh) {
    oauth2.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await oauth2.refreshAccessToken()
    accessToken = credentials.access_token as string
    const newExpiry = credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null

    await supabase
      .from('user_tokens')
      .update({
        access_token: accessToken,
        expires_at: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google')
  }

  if (!accessToken) throw new Error('Missing Google access token after refresh')

  oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  return { oauth2, accessToken }
}
