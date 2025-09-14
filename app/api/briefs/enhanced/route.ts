import { NextResponse } from 'next/server';
import { generateBrief, generateStyledBrief } from '@/server/briefs/generateBrief';
import { fetchUnifiedData } from '@/services/unifiedDataService';
import { createClient } from '@/lib/supabase/server';
import { crisisScenario, normalOperationsScenario, highActivityScenario } from '@/mocks/data/testScenarios';
import { google } from 'googleapis';
import type { UnifiedData } from '@/types/unified';

// Helper function to extract email body from Gmail API payload with better text cleaning
function extractEmailBody(payload: any): string {
  if (!payload) return '';
  
  let bestText = '';
  
  // Handle multipart messages
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        const plainText = Buffer.from(part.body.data, 'base64url').toString('utf-8');
        if (plainText.length > bestText.length) {
          bestText = cleanEmailText(plainText);
        }
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64url').toString('utf-8');
        const cleanedHtml = cleanEmailText(html.replace(/<[^>]*>/g, ' ').trim());
        if (cleanedHtml.length > bestText.length) {
          bestText = cleanedHtml;
        }
      } else if (part.parts) {
        // Recursive search in nested parts
        const nestedBody = extractEmailBody(part);
        if (nestedBody && nestedBody.length > bestText.length) {
          bestText = nestedBody;
        }
      }
    }
  }
  
  // Handle single-part messages
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    const plainText = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    bestText = cleanEmailText(plainText);
  } else if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    bestText = cleanEmailText(html.replace(/<[^>]*>/g, ' ').trim());
  }
  
  return bestText;
}

// Clean email text of common artifacts
function cleanEmailText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove excessive whitespace and line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple line breaks to double
    .replace(/\s+/g, ' ') // Multiple spaces to single
    // Remove email reply headers
    .replace(/^>.*$/gm, '') // Remove quoted lines starting with >
    .replace(/On .* wrote:$/gm, '') // Remove "On ... wrote:" lines
    // Remove common email signatures
    .replace(/--\s*$/gm, '') // Remove signature separator
    // Clean up remaining artifacts
    .replace(/^\s*\n+/, '') // Remove leading empty lines
    .replace(/\n+\s*$/, '') // Remove trailing empty lines
    .trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let startDate = searchParams.get('start');
    let endDate = searchParams.get('end');
    const timeRange = searchParams.get('time_range'); // week, month, custom
    const useRealData = searchParams.get('use_real_data') === 'true';
    const style = searchParams.get('style') || 'mission_brief';
    const scenario = searchParams.get('scenario') || 'normal'; // crisis, normal, high_activity
    
    // Handle convenient time range presets
    if (timeRange && !startDate && !endDate) {
      const now = new Date();
      const end = now.toISOString();
      let start: Date;
      
      switch (timeRange) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3days':
          start = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to week
      }
      
      startDate = start.toISOString();
      endDate = end;
    }
    
    // Validate style parameter
    const validStyles = ['mission_brief', 'startup_velocity', 'management_consulting', 'newsletter'];
    const briefStyle = validStyles.includes(style) ? style as any : 'mission_brief';

    let unified;
    let user = null;
    
    if (useRealData) {
      // Resolve authenticated user for real data
      const supabase = await createClient();
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;

      // Fetch real Gmail data for brief generation
      console.log('🔄 Fetching real Gmail data for brief generation');
      // Progressive fetch diagnostics (hoisted for fallback debug)
      type Attempt = { query: string; maxResults: number; listed: number; processed: number; error?: string };
      let attempts: Attempt[] = [];
      let scopeVerified: boolean | undefined = undefined;
      let scopeList: string | undefined = undefined;
      let tokenRefreshed = false;
      
      try {
        // Get Gmail tokens with same logic as debug endpoint
        const { data: tokens, error: tokenError } = await supabase
          .from('user_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .limit(1);
        
        if (tokenError || !tokens?.[0]) {
          throw new Error('No Gmail tokens found - please reconnect Gmail');
        }

        const token = tokens[0];
        
        // Check if token needs refresh (same logic as debug endpoint)
        const now = Math.floor(Date.now() / 1000);
        const expiresAtTimestamp = typeof token.expires_at === 'string' 
          ? parseInt(token.expires_at, 10)
          : typeof token.expires_at === 'number' 
            ? token.expires_at 
            : null;
        
        let accessToken = token.access_token;
        
        if (expiresAtTimestamp && expiresAtTimestamp < now) {
          console.log('🔄 Token expired, refreshing...');
          
          if (!token.refresh_token) {
            throw new Error('Token expired and no refresh token available');
          }
          
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          oauth2Client.setCredentials({
            access_token: token.access_token,
            refresh_token: token.refresh_token,
          });
          
          const { credentials } = await oauth2Client.refreshAccessToken();
          
          if (credentials.access_token) {
            await supabase
              .from('user_tokens')
              .update({
                access_token: credentials.access_token,
                expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('provider', 'google');
            
            accessToken = credentials.access_token;
            tokenRefreshed = true;
          }
        }
        
        // Ensure token has full gmail.readonly scope (briefs require content access) AFTER accessToken is finalized
        try {
          const infoRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
          const info = await infoRes.json();
          const scopes: string = info.scope || '';
          scopeList = scopes;
          const hasFullRead = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
          scopeVerified = hasFullRead;
          if (!hasFullRead) {
            console.warn('⚠️ Gmail token missing gmail.readonly scope. Briefs need full content access.');
            return NextResponse.json({
              error: 'Insufficient Gmail permissions',
              message: 'Please reconnect Gmail with full read permission to generate briefs.',
              reconnect: '/api/auth/gmail/authorize?redirect=/briefs/current'
            }, { status: 403 });
          }
        } catch (e) {
          console.warn('⚠️ Unable to verify Gmail token scopes; proceeding. Error:', e);
        }
        
        // Fetch Gmail messages (progressive filtering)
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        attempts = [];
        // Optimized progressive filtering for executive intelligence
        const passes = [
          { name: 'executive_priority', maxResults: 30, skipPromotions: true, skipNoreply: true, windowDays: 7, priorityOnly: true },
          { name: 'business_critical', maxResults: 50, skipPromotions: true, skipNoreply: true, windowDays: 7, priorityOnly: false },
          { name: 'extended_scope', maxResults: 75, skipPromotions: true, skipNoreply: false, windowDays: 14, priorityOnly: false },
          { name: 'comprehensive', maxResults: 100, skipPromotions: false, skipNoreply: false, windowDays: 30, priorityOnly: false },
        ];

        const realEmails: Array<{ id: string; messageId: string; subject: string; body: string; from: string; to: string[]; date: string; labels: string[]; isRead: boolean; metadata: { insights: { priority: 'high' | 'medium' | 'low'; hasActionItems: boolean; isUrgent: boolean } } }> = [];

        for (const pass of passes) {
          if (realEmails.length >= 10) break;
          let messages: Array<{ id?: string | null }> = [];
          try {
            // Build Gmail query for better filtering
            let query = '-in:spam -in:trash';
            if (pass.skipPromotions) query += ' -category:promotions -category:social';
            if (pass.skipNoreply) query += ' -from:(noreply OR no-reply)';
            if (pass.windowDays) query += ` newer_than:${pass.windowDays}d`;
            if (pass.priorityOnly) query += ' (is:important OR from:(ceo OR board OR client OR customer))';

            const listResp = await gmail.users.messages.list({
              userId: 'me',
              maxResults: pass.maxResults,
              q: query
            });
            messages = (listResp.data.messages || []) as Array<{ id?: string | null }>;
          } catch (err: any) {
            const msg = err?.message ? String(err.message) : 'list_failed';
            attempts.push({ query: pass.name, maxResults: pass.maxResults, listed: 0, processed: 0, error: msg });
            continue;
          }
          let processed = 0;

          for (let i = 0; i < Math.min(10 - realEmails.length, messages.length); i++) {
            const msg = messages[i];
            try {
              // First get metadata
              const meta = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!,
                format: 'metadata',
                metadataHeaders: ['subject', 'from', 'to', 'date'],
              });
              const headers = (meta.data.payload?.headers || []) as Array<{ name?: string | null; value?: string | null }>;
              const getHeader = (name: string) => {
                const target = name.toLowerCase();
                const found = headers.find((h) => typeof h?.name === 'string' && (h!.name as string).toLowerCase() === target);
                return (found?.value as string) || '';
              };

              const subject = getHeader('subject');
              const from = getHeader('from');
              const toValue = getHeader('to') || user.email || '';
              const dateStr = getHeader('date');
              const date = dateStr ? new Date(dateStr) : new Date();
              const snippet = meta.data.snippet || '';
              const isPromoLabel = meta.data.labelIds?.includes('CATEGORY_PROMOTIONS') || meta.data.labelIds?.includes('CATEGORY_SOCIAL');
              const isNoreply = /noreply|no-reply/i.test(from);
              
              // Get full email body for analysis
              let fullBody = snippet; // Fallback to snippet
              try {
                const fullMessage = await gmail.users.messages.get({
                  userId: 'me',
                  id: msg.id!,
                  format: 'full'
                });
                const extractedBody = extractEmailBody(fullMessage.data.payload);
                console.log(`📧 Email ${msg.id}: snippet=${snippet.length}chars, extracted=${extractedBody?.length || 0}chars`);
                if (extractedBody && extractedBody.length > snippet.length) {
                  fullBody = extractedBody;
                  console.log(`✅ Using full body for ${msg.id}: ${extractedBody.substring(0, 100)}...`);
                } else {
                  console.log(`⚠️ Using snippet for ${msg.id}: ${snippet.substring(0, 100)}...`);
                }
              } catch (bodyError) {
                console.log(`⚠️ Could not fetch full body for message ${msg.id}, using snippet`);
              }

              // Time window filter
              if (pass.windowDays) {
                const cutoff = Date.now() - pass.windowDays * 24 * 60 * 60 * 1000;
                if (date.getTime() < cutoff) {
                  continue;
                }
              }

              // Enhanced filtering for executive intelligence
              if (pass.skipPromotions && (isPromoLabel)) continue;
              if (pass.skipNoreply && isNoreply) continue;

              if (subject) {
                const hasUrgentKeywords = /urgent|asap|important|action.*required|deadline|due|critical|escalation/i.test(subject + ' ' + fullBody);
                const isUnread = meta.data.labelIds?.includes('UNREAD') ?? false;
                const hasActionKeywords = /meeting|schedule|review|approve|feedback|decision|follow.*up|question|request|confirm/i.test(subject + ' ' + fullBody);
                const hasExecutiveKeywords = /ceo|board|investor|client|customer|partnership|budget|revenue|strategy/i.test(subject + ' ' + fullBody);

                // Enhanced priority classification for executives
                const priority: 'high' | 'medium' | 'low' =
                  hasUrgentKeywords || hasExecutiveKeywords ? 'high' :
                  hasActionKeywords || isUnread ? 'medium' : 'low';

                // Priority-only pass filters to high priority items
                if (pass.priorityOnly && priority !== 'high') continue;
                realEmails.push({
                  id: String(msg.id!),
                  messageId: String(msg.id!),
                  subject,
                  body: fullBody || `Email from ${from}`,
                  from,
                  to: toValue ? [toValue] : [],
                  date: date.toISOString(),
                  labels: meta.data.labelIds || [],
                  isRead: !isUnread,
                  metadata: {
                    insights: {
                      priority,
                      hasActionItems: hasActionKeywords || hasUrgentKeywords,
                      isUrgent: hasUrgentKeywords,
                      isExecutive: hasExecutiveKeywords,
                      needsResponse: hasActionKeywords && !isUnread,
                      estimatedResponseTime: hasUrgentKeywords ? 60 : hasActionKeywords ? 240 : 1440 // minutes
                    }
                  },
                });
              }

              processed++;
              if (messages.length > 1) await new Promise((r) => setTimeout(r, 80));
            } catch (error) {
              console.error(`Error processing message ${msg.id}:`, error);
            }
          }

          attempts.push({ query: pass.name, maxResults: pass.maxResults, listed: messages.length, processed });
          if (realEmails.length >= 5) break; // good enough
        }

        console.log(`✅ Gmail progressive fetch produced ${realEmails.length} messages`, attempts);

        unified = {
          emails: realEmails,
          incidents: [],
          calendarEvents: [],
          tickets: [],
          generated_at: new Date().toISOString(),
        };
        
      } catch (gmailError) {
        console.error('❌ Failed to fetch real Gmail data:', gmailError);
        // Fall back to empty structure if Gmail fails
        unified = {
          emails: [],
          incidents: [],
          calendarEvents: [],
          tickets: [],
          generated_at: new Date().toISOString(),
        };
      }
      
      // Call Python analysis service for executive intelligence processing
      try {
        console.log(`🧠 GET: Calling Python analysis service with ${unified.emails.length} emails for intelligent processing...`);
        
        // First, use the new email intelligence extraction for filtering and insights
        if (unified.emails.length > 0) {
          try {
            console.log(`🔍 Extracting executive intelligence from ${unified.emails.length} emails...`);
            
            const extractionResponse = await fetch('http://localhost:8000/process-email-batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                emails: unified.emails.map(email => ({
                  content: email.body || email.subject || '',
                  sender: email.from,
                  subject: email.subject,
                  date: email.date
                }))
              })
            });
            
            if (extractionResponse.ok) {
              const extractionResult = await extractionResponse.json();
              console.log(`✅ Intelligence extraction complete: ${extractionResult.relevant} relevant, ${extractionResult.filtered} filtered`);
              
              // Enrich emails with extracted intelligence
              if (extractionResult.results && extractionResult.results.length > 0) {
                console.log(`📊 Intelligence extraction results:`, extractionResult.results.length);
                
                // Create map keyed by sender for easier lookup
                const intelligenceMap = new Map(extractionResult.results.map((r: any) => [r.sender, r]));
                
                // Enrich email data with intelligence metadata
                unified.emails = unified.emails.map((email, index) => {
                  const intelligence = intelligenceMap.get(email.from) || intelligenceMap.get(email.from.split('<')[1]?.replace('>', ''));
                  if (intelligence) {
                    console.log(`📧 Enriching email from ${email.from} with intelligence type: ${intelligence.type}`);
                    return {
                      ...email,
                      metadata: {
                        ...email.metadata,
                        intelligence: {
                          type: intelligence.type || 'general',
                          projects: intelligence.projects || [],
                          blockers: intelligence.blockers || [],
                          achievements: intelligence.achievements || [],
                          key_summary: intelligence.key_summary || intelligence.title || email.subject
                        }
                      }
                    };
                  } else {
                    // Provide default intelligence structure
                    return {
                      ...email,
                      metadata: {
                        ...email.metadata,
                        intelligence: {
                          type: 'general',
                          projects: [],
                          blockers: [],
                          achievements: [],
                          key_summary: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : '')
                        }
                      }
                    };
                  }
                });
                
                console.log(`✅ Enhanced ${unified.emails.length} emails with intelligence data`);
              }
            }
          } catch (extractionError) {
            console.warn('⚠️ Intelligence extraction failed, continuing with basic processing:', extractionError);
          }
        }
        
        // Transform emails to the format expected by FastAPI bridge
        const emailsForAnalysis = unified.emails.map(email => ({
          id: email.id,
          subject: email.subject || "",
          body: email.body || "",
          from_name: email.from.includes('<') ? email.from.split('<')[0].trim() : email.from,
          from_email: email.from.includes('<') ? email.from.match(/<(.+)>/)?.[1] || email.from : email.from,
          to_recipients: Array.isArray(email.to) ? email.to : [email.to || ""],
          cc_recipients: [],
          date: email.date,
          threadId: email.messageId || email.id
        }));
        
        const analysisResponse = await fetch(`http://localhost:8000/analytics?use_real_data=true&user_id=${user.id}&days_back=7&filter_marketing=true`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (analysisResponse.ok) {
          const analyticsData = await analysisResponse.json();
          if (analyticsData.dataSource === 'real_data_direct') {
            console.log(`✅ GET: Analytics API completed with real data: ${analyticsData.message}`);
            
            // Use the unified data structure directly for brief generation  
            const unifiedData: UnifiedData = {
              emails: realEmails,
              incidents: [],
              calendarEvents: [],
              tickets: [],
              generated_at: new Date().toISOString(),
            };
            const briefData = generateStyledBrief(unifiedData, briefStyle);
            
            return NextResponse.json({
              ...briefData,
              userId: user.email,
              dataSource: 'real_email_analysis',
              message: analyticsData.message,
              generationParams: {
                style: briefStyle,
                scenario: undefined,
                timeRange
              },
              availableTimeRanges: ['3days', 'week', 'month'],
              analyticsData: analyticsData // Include analytics for debugging
            });
          }
        }
        
        console.log(`⚠️ GET: Python analysis failed, falling back to basic processing...`);
      } catch (analysisError) {
        console.error('⚠️ GET: Python analysis service error:', analysisError);
      }
      
      console.log('✅ Using real data structure for brief generation:', {
        emails: unified.emails.length,
        incidents: unified.incidents.length,
        calendarEvents: unified.calendarEvents.length,
        tickets: unified.tickets.length,
        userEmail: user.email
      });

      // If no real emails available, return a proper "no data" response
      if (!unified.emails.length) {
        const emptyUnified: UnifiedData = {
          emails: [],
          incidents: [],
          calendarEvents: [],
          tickets: [],
          generated_at: new Date().toISOString(),
        };
        
        const emptyBrief = generateStyledBrief(emptyUnified, briefStyle);
        return NextResponse.json({
          ...emptyBrief,
          userId: user.email,
          dataSource: 'real_data_empty',
          message: 'No actionable emails found in the specified time range. Check your Gmail for recent business communications.',
          timeRange: timeRange || 'week',
          availableStyles: validStyles,
          availableTimeRanges: ['3days', 'week', 'month'],
          rawAnalyticsData: emptyUnified,
          debug: {
            reason: 'no_actionable_emails',
            realEmailsCount: 0,
            filtersUsed: '-category:{promotions} -category:{social} -in:spam -in:trash -from:(noreply OR no-reply) newer_than:7d',
            timeRange: timeRange || 'week',
            attempts,
            scopeVerified,
            tokenRefreshed,
            ...(scopeList ? { scopeList } : {}),
          }
        });
      }
    } else {
      // Use mock scenario data
      unified = getScenarioData(scenario);
    }

    // Generate the styled brief
    const briefData = generateStyledBrief(unified, briefStyle);
    
    return NextResponse.json({
      ...briefData,
      userId: useRealData ? user?.email || briefData.userId : briefData.userId,
      dataSource: useRealData ? 'real' : 'mock',
      scenario: useRealData ? undefined : scenario,
      timeRange: timeRange || 'week',
      availableStyles: validStyles,
      availableScenarios: ['normal', 'crisis', 'high_activity'],
      availableTimeRanges: ['3days', 'week', 'month'],
      rawAnalyticsData: unified // Include raw data for LLM experimentation
    });
    
  } catch (e: any) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/briefs/enhanced',
      method: 'GET',
      error: e?.message ?? 'Unknown error',
      stack: e?.stack,
      userAgent: req.headers.get('user-agent'),
    };
    
    console.error('📋 Enhanced brief generation error:', JSON.stringify(errorDetails, null, 2));
    
    // Return user-friendly error with debugging info
    return NextResponse.json({ 
      error: 'Brief generation failed',
      message: e?.message?.includes('token') ? 'Gmail connection expired. Please reconnect your account.' :
               e?.message?.includes('scope') ? 'Gmail permissions insufficient. Please reconnect with full access.' :
               e?.message?.includes('quota') ? 'Gmail API quota exceeded. Please try again later.' :
               'Unable to generate brief. Please try again or contact support.',
      dataSource: 'error',
      timestamp: errorDetails.timestamp,
      ...(process.env.NODE_ENV === 'development' && { debug: errorDetails })
    }, { status: 500 });
  }
}

function getScenarioData(scenario: string) {
  switch (scenario) {
    case 'crisis':
      return crisisScenario;
    case 'high_activity':
      return highActivityScenario;
    case 'normal':
    default:
      return normalOperationsScenario;
  }
}

// Enhanced POST method for generating briefs with custom parameters
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      style = 'mission_brief',
      useRealData = false,
      scenario = 'normal',
      timeRange,
      customData 
    } = body;

    // Validate inputs
    const validStyles = ['mission_brief', 'startup_velocity', 'management_consulting', 'newsletter'];
    const briefStyle = validStyles.includes(style) ? style as any : 'mission_brief';
    
    let unified;
    let user = null;
    
    if (customData) {
      // Use provided custom data (for testing/demos)
      unified = customData;
    } else if (useRealData) {
      const supabase = await createClient();
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      user = authUser;
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        // Fetch real Gmail data for brief generation (same as GET endpoint logic)
        console.log('🔄 POST: Fetching real Gmail data for brief generation');
        
        // Get Gmail tokens
        const { data: tokens, error: tokenError } = await supabase
          .from('user_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .limit(1);
        
        if (tokenError || !tokens?.[0]) {
          throw new Error('No Gmail tokens found - please reconnect Gmail');
        }
        
        const token = tokens[0];
        
        // Check if token needs refresh
        const now = Math.floor(Date.now() / 1000);
        const expiresAtTimestamp = typeof token.expires_at === 'string' 
          ? parseInt(token.expires_at, 10)
          : typeof token.expires_at === 'number' 
            ? token.expires_at 
            : null;
        
        let accessToken = token.access_token;
        
        if (expiresAtTimestamp && expiresAtTimestamp < now) {
          console.log('🔄 POST: Token expired, refreshing...');
          
          if (!token.refresh_token) {
            throw new Error('Token expired and no refresh token available');
          }
          
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          oauth2Client.setCredentials({
            access_token: token.access_token,
            refresh_token: token.refresh_token,
          });
          
          const { credentials } = await oauth2Client.refreshAccessToken();
          
          if (credentials.access_token) {
            await supabase
              .from('user_tokens')
              .update({
                access_token: credentials.access_token,
                expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('provider', 'google');
            
            accessToken = credentials.access_token;
          }
        }
        
        // Fetch Gmail messages
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        // Use optimized Gmail query for executive priorities
        const listResponse = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 30,
          q: '-category:{promotions} -category:{social} -in:spam -in:trash -from:(noreply OR no-reply) newer_than:7d (is:important OR from:(ceo OR board OR client OR customer) OR has:attachment)'
        });
        
        const realEmails = [];
        
        if (listResponse.data.messages) {
          for (let i = 0; i < Math.min(10, listResponse.data.messages.length); i++) {
            const msg = listResponse.data.messages[i];
            
            try {
              const fullMessage = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id!,
                format: 'full'
              });
              
              const headers = fullMessage.data.payload?.headers || [];
              const getHeader = (name: string) => headers.find((h: any) => 
                h.name.toLowerCase() === name.toLowerCase())?.value || '';
              
              const subject = getHeader('subject');
              const from = getHeader('from');
              const snippet = fullMessage.data.snippet || '';
              const emailBody = extractEmailBody(fullMessage.data.payload) || snippet || `Email from ${from}`;
              const toValue = getHeader('to') || user.email || '';
              
              // Skip promotional/automated emails
              const isPromotional = fullMessage.data.labelIds?.includes('CATEGORY_PROMOTIONS') ||
                                    fullMessage.data.labelIds?.includes('CATEGORY_SOCIAL') ||
                                    from.toLowerCase().includes('noreply') ||
                                    from.toLowerCase().includes('no-reply');

              if (!isPromotional && subject) {
                const hasUrgentKeywords = /urgent|asap|important|action.*required|deadline|due/i.test(subject + ' ' + snippet);
                const isUnread = fullMessage.data.labelIds?.includes('UNREAD');
                const hasActionKeywords = /meeting|schedule|review|approve|feedback|decision|follow.*up/i.test(subject + ' ' + snippet);
                
                const priority = hasUrgentKeywords ? 'high' : hasActionKeywords ? 'medium' : 'low';
                
                realEmails.push({
                  id: String(msg.id!),
                  messageId: String(msg.id!),
                  subject: subject,
                  body: emailBody,
                  from: from,
                  to: toValue ? [toValue] : [],
                  date: getHeader('date') || new Date().toISOString(),
                  labels: fullMessage.data.labelIds || [],
                  isRead: !isUnread,
                  metadata: {
                    insights: {
                      priority: priority as 'high' | 'medium' | 'low',
                      hasActionItems: hasActionKeywords || hasUrgentKeywords,
                      isUrgent: hasUrgentKeywords
                    }
                  }
                });
              }
              
              // Rate limiting
              if (i < listResponse.data.messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (error) {
              console.error(`POST: Error processing message ${msg.id}:`, error);
            }
          }
        }
        
        console.log(`✅ POST: Successfully fetched ${realEmails.length} real Gmail messages for brief`);
        
        // Call Python analysis service for executive intelligence processing
        try {
          console.log(`🧠 POST: Calling Python analysis service with ${realEmails.length} emails for intelligent processing...`);
          
          // Transform emails to the format expected by FastAPI bridge
          const emailsForAnalysis = realEmails.map(email => ({
            id: email.id,
            subject: email.subject || "",
            body: email.body || "",
            from_name: email.from.includes('<') ? email.from.split('<')[0].trim() : email.from,
            from_email: email.from.includes('<') ? email.from.match(/<(.+)>/)?.[1] || email.from : email.from,
            to_recipients: Array.isArray(email.to) ? email.to : [email.to || ""],
            cc_recipients: [],
            date: email.date,
            threadId: email.messageId || email.id
          }));
          
          const analysisResponse = await fetch(`http://localhost:8000/analytics?use_real_data=true&user_id=${user.id}&days_back=7&filter_marketing=true`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (analysisResponse.ok) {
            const analyticsData = await analysisResponse.json();
            if (analyticsData.dataSource === 'real_data_direct') {
              console.log(`✅ POST: Analytics API completed with real data: ${analyticsData.message}`);
              
              // Use the unified data structure directly for brief generation  
              const unifiedData: UnifiedData = {
                emails: realEmails,
                incidents: [],
                calendarEvents: [],
                tickets: [],
                generated_at: new Date().toISOString(),
              };
              const briefData = generateStyledBrief(unifiedData, briefStyle);
              
              return NextResponse.json({
                ...briefData,
                userId: user.email,
                dataSource: 'real_email_analysis',
                message: analyticsData.message,
                generationParams: {
                  style: briefStyle,
                  timeRange,
                  analysisEngine: 'real_data'
                },
                availableTimeRanges: ['3days', 'week', 'month'],
                analyticsData: analyticsData // Include analytics for debugging
              });
            }
          }
          
          console.log(`⚠️ Python analysis failed, falling back to basic processing...`);
        } catch (analysisError) {
          console.error('⚠️ Python analysis service error:', analysisError);
        }
        
        // Fallback: use existing unified data structure
        unified = {
          emails: realEmails,
          incidents: [],
          calendarEvents: [],
          tickets: [],
          generated_at: new Date().toISOString(),
        };
        
        // If no real data available, fall back to demo data
        if (!unified.emails.length) {
          unified = getScenarioData('normal');
          const briefData = generateStyledBrief(unified, briefStyle);
          return NextResponse.json({
            ...briefData,
            userId: user.email,
            dataSource: 'mock',
            warning: 'No recent actionable emails found. Using demo data instead. Check your Gmail for recent messages.'
          });
        }
        
      } catch (error) {
        console.error('POST: Real Gmail data fetch failed, falling back to demo:', error);
        unified = getScenarioData('normal');
        const briefData = generateStyledBrief(unified, briefStyle);
        return NextResponse.json({
          ...briefData,
          userId: user?.email,
          dataSource: 'mock',
          warning: 'Unable to access your Gmail data. Using demo data instead. Please check your Gmail connection.'
        });
      }
    } else {
      unified = getScenarioData(scenario);
    }

    const briefData = generateStyledBrief(unified, briefStyle);
    
    return NextResponse.json({
      ...briefData,
      userId: useRealData && user ? user.email : briefData.userId,
      dataSource: customData ? 'custom' : (useRealData ? 'real' : 'mock'),
      generationParams: {
        style: briefStyle,
        scenario: useRealData ? undefined : scenario,
        timeRange
      },
      availableTimeRanges: ['3days', 'week', 'month'],
      rawAnalyticsData: unified // Include raw data for LLM experimentation
    });
    
  } catch (e: any) {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/briefs/enhanced',
      method: 'POST',
      error: e?.message ?? 'Unknown error',
      stack: e?.stack,
      userAgent: req.headers.get('user-agent'),
    };
    
    console.error('📋 Enhanced brief generation error (POST):', JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json({ 
      error: 'Brief generation failed',
      message: e?.message?.includes('token') ? 'Gmail connection expired. Please reconnect your account.' :
               e?.message?.includes('scope') ? 'Gmail permissions insufficient. Please reconnect with full access.' :
               e?.message?.includes('quota') ? 'Gmail API quota exceeded. Please try again later.' :
               'Unable to generate brief. Please try again or contact support.',
      dataSource: 'error',
      timestamp: errorDetails.timestamp,
      ...(process.env.NODE_ENV === 'development' && { debug: errorDetails })
    }, { status: 500 });
  }
}