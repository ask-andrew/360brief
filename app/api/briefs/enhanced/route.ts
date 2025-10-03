import { NextResponse } from 'next/server';
import { generateBrief, generateStyledBrief } from '@/server/briefs/generateBrief';
import { fetchUnifiedData } from '@/services/unifiedDataService';
import { createClient } from '@/lib/supabase/server';
import { crisisScenario, normalOperationsScenario, highActivityScenario } from '@/mocks/data/testScenarios';
import { google } from 'googleapis';
import type { UnifiedData } from '@/types/unified';
import { getTokenManager } from '@/lib/gmail/token-manager';

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
    const useStreaming = searchParams.get('streaming') !== 'false'; // Default to true for enhanced processing
    const style = searchParams.get('style') || 'mission_brief';
    const scenario = searchParams.get('scenario') || 'normal'; // crisis, normal, high_activity
    const useLLM = searchParams.get('use_llm') === 'true'; // Default to false
    // Heuristic clustering tuning params
    const topicThreshParam = searchParams.get('topic_thresh');
    const topicTopNParam = searchParams.get('topic_topn');
    const topicBigramsParam = searchParams.get('topic_bigrams');
    
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

    let unified: UnifiedData;
    let user = null;
    
    if (useRealData) {
      // Resolve authenticated user for real data
      const supabase = await createClient();
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;

      // Skip streaming for now - use direct Gmail + enhanced analytics
      console.log('🧠 Enhanced: Using direct Gmail fetch + Python analytics service');

      // Fetch real Gmail data for brief generation
      console.log('🔄 Fetching real Gmail data for brief generation');
      // Progressive fetch diagnostics (hoisted for fallback debug)
      type Attempt = { query: string; maxResults: number; listed: number; processed: number; error?: string };
      let attempts: Attempt[] = [];
      let scopeVerified: boolean | undefined = undefined;
      let scopeList: string | undefined = undefined;
      let tokenRefreshed = false;
      
      try {
        // Use TokenManager for clean token handling
        const tokenManager = getTokenManager();
        const tokens = await tokenManager.getTokens(user.id, 'google');

        if (!tokens || !tokens.access_token) {
          throw new Error('No Gmail tokens found - please reconnect Gmail');
        }

        const accessToken = tokens.access_token;
        tokenRefreshed = tokens.expires_at !== null; // Token was potentially refreshed if it had an expiry
        
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
          console.warn('⚠️ Unable to verify Gmail token scopes via tokeninfo API; proceeding with Gmail fetch. Error:', e);
          scopeVerified = undefined; // Unknown
        }
        
        // Fetch Gmail messages (progressive filtering)
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        attempts = [];
        // Optimized progressive filtering for executive intelligence
        const passes = [
          // Reduce noise early: skip promotions and no-reply first
          { name: 'executive_priority', maxResults: 100, skipPromotions: true,  skipNoreply: true,  windowDays: 7,  priorityOnly: false },
          { name: 'business_critical', maxResults: 200, skipPromotions: true,  skipNoreply: true,  windowDays: 14, priorityOnly: false },
          // Expand only if needed
          { name: 'extended_scope',    maxResults: 300, skipPromotions: false, skipNoreply: false, windowDays: 21, priorityOnly: false },
          { name: 'comprehensive',     maxResults: 500, skipPromotions: false, skipNoreply: false, windowDays: 30, priorityOnly: false },
        ];

        const realEmails: Array<{ id: string; messageId: string; threadId: string; subject: string; body: string; from: string; to: string[]; date: string; labels: string[]; isRead: boolean; metadata: { insights: { priority: 'high' | 'medium' | 'low'; hasActionItems: boolean; isUrgent: boolean; isExecutive?: boolean; needsResponse?: boolean; estimatedResponseTime?: number } } }> = [];

        for (const pass of passes) {
          if (realEmails.length >= 50) break;
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

          for (let i = 0; i < Math.min(100 - realEmails.length, messages.length); i++) {
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
              const threadId = (meta as any)?.data?.threadId || (msg.id as string);
              
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
                  threadId: String(threadId),
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
          if (realEmails.length >= 50) break; // Get more emails for better insights
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

      // Apply clustering to organize emails by topic (if we have emails)
      let clusteringResult: any = null;
      if (unified.emails.length >= 2) {
        try {
          console.log(`🔗 Applying clustering to ${unified.emails.length} emails...`);

          const clusteringResponse = await fetch('http://localhost:3000/api/clustering/integrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('cookie') || '' // Forward auth cookies
            },
            body: JSON.stringify({
              user_id: user?.id,
              digest_id: `brief_${Date.now()}`,
              emails: unified.emails.map(email => ({
                id: email.id,
                subject: email.subject,
                body: email.body,
                from_address: email.from,
                to: email.to,
                date: email.date,
                labels: email.labels || [],
                has_attachments: false,
                metadata: email.metadata || {}
              }))
            })
          });

          if (clusteringResponse.ok) {
            clusteringResult = await clusteringResponse.json();
            console.log(`✅ Clustering produced ${clusteringResult.metrics?.clusters_found || 0} topic clusters`);

            // Update unified.emails with clustering metadata
            if (clusteringResult.digest_items) {
              const clusteredEmails = unified.emails.map(email => {
                const clusterItem = clusteringResult.digest_items.find((item: any) => item.id === email.id);
                if (clusterItem?.clustering_info) {
                  return {
                    ...email,
                    metadata: {
                      ...email.metadata,
                      clustering: clusterItem.clustering_info
                    }
                  };
                }
                return email;
              });
              unified.emails = clusteredEmails;
            }
          } else {
            console.warn('⚠️ Clustering failed, continuing without clustering');
          }
        } catch (clusteringError) {
          console.warn('⚠️ Clustering error:', clusteringError);
        }
      }

      // Simple heuristic digest builder for non-LLM path or fallback
      function buildHeuristicDigest(): any {
        // Utilities
        const parseAmount = (text: string): number[] => {
          if (!text) return [];
          const matches = Array.from(text.matchAll(/\$\s?([0-9]{1,3}(?:[,][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g));
          return matches.map(m => Number(String(m[1]).replace(/,/g, ''))).filter(n => !Number.isNaN(n));
        };
        const normalizeSubject = (s?: string) => (s || '')
          .replace(/^\s*(re|fw|fwd)\s*:\s*/i, '')
          .replace(/\[[^\]]+\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const toLowerWords = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        const STOP = new Set(['the','a','an','and','or','to','of','for','on','in','is','are','with','at','by','from','re','fw','fwd','about','your','my','our','this','that']);
        const isNewsletter = (from: string, body: string, subject: string) => {
          const f = from || '';
          const dom = (f.match(/@([^>\s]+)/)?.[1] || '').toLowerCase();
          const marketingLike = /news|newsletter|digest|updates?|promo|marketing|noreply|no-reply|mailer|do[-_.]?not[-_.]?reply/i;
          const unsubscribe = /unsubscribe|manage\s+preferences|view\s+in\s+browser/i;
          const heavyHtml = /<table|<td|<tr|style=|img\s|mso-/i;
          return marketingLike.test(f) || marketingLike.test(dom) || unsubscribe.test(body || '') || heavyHtml.test(body || '') || marketingLike.test(subject || '');
        };

        // 1) Pre-filter emails and build thread groups (prefer Gmail threadId)
        const emails = (unified.emails || []) as any[];
        const signalEmails = emails.filter(e => {
          const subj = normalizeSubject(e.subject || '');
          if (!subj) return false; // drop empty subjects
          if (isNewsletter(e.from || '', e.body || '', subj)) return false;
          return true;
        });

        const threads = new Map<string, any[]>();
        for (const e of signalEmails) {
          const key = e.threadId || normalizeSubject(e.subject || '') || e.id;
          if (!threads.has(key)) threads.set(key, []);
          threads.get(key)!.push(e);
        }

        // 2) Score threads and extract summaries grounded in content
        type ThreadSummary = { id: string; subject: string; stakeholders: string[]; latestDate?: string; snippet: string; metrics: { decisions: number; blockers: number; achievements: number; financial: number; count: number } };
        const summarizeThread = (list: any[]): ThreadSummary => {
          let d = 0, b = 0, a = 0; let fin: number[] = [];
          let latestDate = '';
          const sset = new Set<string>();
          const subject = normalizeSubject(list[0]?.subject || 'No subject');
          let bestSnippet = '';
          for (const it of list) {
            const content = `${it.subject || ''} ${it.body || ''}`;
            if (/(approve|decision|confirm|review|consent|sign\s?off|deadline|signing)/i.test(content)) d++;
            if (/(blocked|issue|cannot|error|fail|urgent|delay|risk|escalat)/i.test(content)) b++;
            if (/(launched|shipped|won|closed\s+deal|congrats|milestone|delivered|completed)/i.test(content)) a++;
            if (!isNewsletter(it.from || '', it.body || '', it.subject || '')) fin.push(...parseAmount(content));
            if (it.from) sset.add(String(it.from).split('<')[0].trim());
            const candidate = (it.body || '').replace(/\s+>/g, '>').split('\n').filter((ln: string) => ln && !/^>/.test(ln)).join(' ').slice(0, 240);
            if (candidate.length > bestSnippet.length) bestSnippet = candidate;
            if (!latestDate || (it.date && it.date > latestDate)) latestDate = it.date;
          }
          fin = fin.sort((x,y)=>x-y);
          const totalFin = Math.round(fin.reduce((x,y)=>x+y,0));
          return {
            id: list[0]?.threadId || list[0]?.id,
            subject,
            stakeholders: Array.from(sset).slice(0,4),
            latestDate,
            snippet: bestSnippet,
            metrics: { decisions: d, blockers: b, achievements: a, financial: totalFin, count: list.length }
          };
        };

        const threadSummaries: ThreadSummary[] = Array.from(threads.values()).map(summarizeThread)
          .filter(t => t.subject && t.subject.length > 2);

        // 3) Build topic clusters using Jaccard over per-thread signatures
        const URL_TOKEN = /https?:\/\/\S+|www\.\S+/gi;
        const EMAIL_TOKEN = /\b[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}\b/g;
        const HTML_TAG = /<[^>]+>/g;
        const CLEAN_QUOTES = /\"|\'|“|”|‘|’/g;

        const extractTokens = (text: string): string[] => {
          const cleaned = (text || '')
            .replace(URL_TOKEN, ' ')
            .replace(EMAIL_TOKEN, ' ')
            .replace(HTML_TAG, ' ')
            .replace(CLEAN_QUOTES, '')
            .replace(/\[[^\]]+\]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
          return cleaned.split(/[^a-z0-9]+/).filter(w => w && w.length > 2 && !STOP.has(w));
        };

        const makeBigrams = (tokens: string[]): string[] => {
          const out: string[] = [];
          for (let i = 0; i < tokens.length - 1; i++) {
            out.push(tokens[i] + ' ' + tokens[i+1]);
          }
          return out;
        };

        const TOPN = Math.min(30, Math.max(8, Number(topicTopNParam ?? 15) || 15)); // top features per thread
        const BIGRAM_WEIGHT = 2;
        const SUBJECT_WEIGHT = 1.5;
        let SIM_THRESHOLD = 0.28; // Jaccard threshold
        if (topicThreshParam) {
          const v = Number(topicThreshParam);
          if (!Number.isNaN(v)) SIM_THRESHOLD = Math.min(0.8, Math.max(0.1, v));
        }

        const ENABLE_BIGRAMS = (topicBigramsParam ?? 'true') !== 'false';

        // Build signatures per thread from underlying emails
        const threadEmails = new Map<string, any[]>();
        for (const [tid, list] of threads.entries()) threadEmails.set(String(tid), list);

        const threadSignatures = new Map<string, Set<string>>();
        const threadTitles = new Map<string, string>();
        const threadTokenFreqs = new Map<string, Map<string, number>>();

        for (const [tid, list] of threadEmails.entries()) {
          // Aggregate tokens across emails in thread
          let subjectTokens: string[] = [];
          let bodyTokens: string[] = [];
          for (const e of list) {
            subjectTokens.push(...extractTokens(normalizeSubject(e.subject || '')));
            bodyTokens.push(...extractTokens(e.body || ''));
          }
          const bigrams = ENABLE_BIGRAMS ? makeBigrams([...subjectTokens, ...bodyTokens]) : [];
          const freq = new Map<string, number>();
          const bump = (k: string, w = 1) => freq.set(k, (freq.get(k) || 0) + w);
          for (const t of bodyTokens) bump(t, 1);
          for (const t of subjectTokens) bump(t, SUBJECT_WEIGHT);
          for (const b of bigrams) bump(b, BIGRAM_WEIGHT);

          // Keep top-N tokens/bigrams
          const top = Array.from(freq.entries())
            .sort((a,b) => b[1] - a[1])
            .slice(0, TOPN)
            .map(([k]) => k);
          threadSignatures.set(tid, new Set(top));
          threadTokenFreqs.set(tid, freq);
          // Preferred title from most common subject token(s)
          const subj = normalizeSubject(list[0]?.subject || '');
          threadTitles.set(tid, subj);
        }

        const jaccard = (a: Set<string>, b: Set<string>): number => {
          if (!a.size && !b.size) return 0;
          let inter = 0;
          for (const v of a) if (b.has(v)) inter++;
          const uni = a.size + b.size - inter;
          return inter / Math.max(1, uni);
        };

        // Domain and keyword-aware similarity boost (for e.g., band/music threads)
        const SPECIAL_KEYWORDS = new Set([
          'band','gig','rehearsal','setlist','song','music','guitar','chords','practice','show','performance','ticket','venue','studio',
          'golf','tee','tournament','round','course',
          'library','work','meeting','schedule','deadline','docs','report'
        ]);
        const domainOf = (from: string) => (from?.match(/@([^>\s]+)/)?.[1] || '').toLowerCase();
        const signatureHasSpecial = (sig: Set<string>) => {
          for (const s of sig) {
            const toks = s.split(' ');
            for (const t of toks) if (SPECIAL_KEYWORDS.has(t)) return true;
          }
          return false;
        };

        // Union-find clustering
        const tids = Array.from(threadSignatures.keys());
        const parent = new Map<string, string>();
        const find = (x: string): string => {
          let p = parent.get(x) || x;
          if (p !== x) {
            p = find(p);
            parent.set(x, p);
          }
          return p;
        };
        const unite = (a: string, b: string) => {
          const ra = find(a), rb = find(b);
          if (ra !== rb) parent.set(ra, rb);
        };
        for (const t of tids) parent.set(t, t);

        for (let i = 0; i < tids.length; i++) {
          for (let j = i + 1; j < tids.length; j++) {
            const aSig = threadSignatures.get(tids[i])!;
            const bSig = threadSignatures.get(tids[j])!;
            let s = jaccard(aSig, bSig);
            // Boost if special keywords present in both
            if (signatureHasSpecial(aSig) && signatureHasSpecial(bSig)) s += 0.12;
            // Small boost if same sender domain appears in either thread's emails
            const aEmail = threadEmails.get(tids[i])?.[0];
            const bEmail = threadEmails.get(tids[j])?.[0];
            if (aEmail && bEmail) {
              const domA = domainOf(aEmail.from || '');
              const domB = domainOf(bEmail.from || '');
              if (domA && domB && domA === domB) s += 0.05;
            }
            if (s >= SIM_THRESHOLD) unite(tids[i], tids[j]);
          }
        }

        // Collect clusters
        const clusterMap = new Map<string, ThreadSummary[]>();
        for (const t of tids) {
          const r = find(t);
          if (!clusterMap.has(r)) clusterMap.set(r, []);
          const summary = threadSummaries.find(x => x.id === t);
          if (summary) clusterMap.get(r)!.push(summary);
        }

        // 4) Convert clusters to UI digest_items with grounded actions
        const centralTitleFor = (group: ThreadSummary[]): string => {
          if (!group.length) return 'General';
          // centrality by avg similarity
          let bestIdx = 0, bestScore = -1;
          for (let i = 0; i < group.length; i++) {
            const a = threadSignatures.get(group[i].id)!;
            let sum = 0;
            for (let j = 0; j < group.length; j++) if (i !== j) sum += jaccard(a, threadSignatures.get(group[j].id)!);
            const avg = sum / Math.max(1, group.length - 1);
            if (avg > bestScore) { bestScore = avg; bestIdx = i; }
          }
          const raw = (group[bestIdx]?.subject || '').trim();
          if (raw) {
            // Heuristic category labels override if strong match
            const LABELS: Array<{label: string; keys: string[]}> = [
              { label: 'Music', keys: ['band','gig','rehearsal','setlist','song','music','guitar','chords','practice','show','venue'] },
              { label: 'Golf', keys: ['golf','tee','tournament','round','course'] },
              { label: 'Library/Work', keys: ['library','meeting','schedule','deadline','report','docs','work','project'] },
            ];
            const tokens = toLowerWords(raw);
            for (const {label, keys} of LABELS) {
              if (tokens.some(t => keys.includes(t))) return label;
            }
            return raw;
          }
          // fallback: top tokens of merged freq
          const allFreq = new Map<string, number>();
          const bump = (k: string, v: number) => allFreq.set(k, (allFreq.get(k) || 0) + v);
          for (const g of group) {
            const f = threadTokenFreqs.get(g.id);
            if (!f) continue;
            for (const [k, v] of f) bump(k, v);
          }
          const top = Array.from(allFreq.entries()).sort((a,b)=>b[1]-a[1]).filter(([k]) => k.includes(' ')).slice(0,2).map(([k])=>k);
          // Map bigrams to categories if possible
          const bigramTokens = top.join(' ').split(' ');
          const labelFromBigrams = (() => {
            const music = ['band','gig','rehearsal','music','guitar','chords','setlist'];
            const golf = ['golf','tee','round','tournament'];
            const work = ['library','report','deadline','meeting','project'];
            if (bigramTokens.some(t => music.includes(t))) return 'Music';
            if (bigramTokens.some(t => golf.includes(t))) return 'Golf';
            if (bigramTokens.some(t => work.includes(t))) return 'Library/Work';
            return null;
          })();
          return labelFromBigrams || (top.join(' • ') || 'General');
        };

        const digest_items_unsorted = Array.from(clusterMap.values()).map((group, idx) => {
          // within cluster, sort by signal strength
          group.sort((A,B)=> (B.metrics.blockers - A.metrics.blockers) || (B.metrics.decisions - A.metrics.decisions) || ((B.latestDate||'').localeCompare(A.latestDate||'')) || (B.metrics.count - A.metrics.count));

          let clusterDecisions = 0, clusterBlockers = 0, clusterAchievements = 0;
          let clusterFinancials: number[] = [];
          const stakeholders = new Set<string>();
          for (const t of group) {
            clusterDecisions += t.metrics.decisions;
            clusterBlockers += t.metrics.blockers;
            clusterAchievements += t.metrics.achievements;
            if (t.metrics.financial) clusterFinancials.push(t.metrics.financial);
            t.stakeholders.forEach(s => stakeholders.add(s));
          }

          clusterFinancials = clusterFinancials.sort((a,b)=>a-b);
          const median = clusterFinancials.length ? clusterFinancials[Math.floor(clusterFinancials.length/2)] : 0;
          if (clusterFinancials.length > 2 && median > 0) {
            clusterFinancials = clusterFinancials.filter(v => v <= median * 5);
          }
          const totalFinancial = Math.round(clusterFinancials.reduce((a,b)=>a+b,0));

          const title = centralTitleFor(group);
          const summary = `${clusterDecisions} decisions pending • ${clusterBlockers} blockers • ${clusterAchievements} achievements${totalFinancial ? ` • ~$${totalFinancial.toLocaleString()}` : ''}`;

          // Grounded actions from top threads
          const actions: string[] = [];
          const top = group.slice(0, 3);
          for (const t of top) {
            if (t.metrics.blockers > 0) {
              actions.push(`Unblock: '${t.subject}' — ping ${t.stakeholders[0] || 'owner'} to resolve blockers`);
            } else if (t.metrics.decisions > 0) {
              actions.push(`Decide: '${t.subject}' — provide approval/decision to keep momentum`);
            }
          }
          if (actions.length === 0 && group.length) {
            actions.push(`Follow up: '${group[0].subject}' — confirm next steps with stakeholders`);
          }

          const itemsForUi = group.slice(0, 5).map(t => ({
            subject: t.subject,
            snippet: t.snippet,
            stakeholders: t.stakeholders,
            date: t.latestDate,
            metrics: t.metrics
          }));

          const urgencyScore = (clusterBlockers * 3) + (clusterDecisions * 2) + (clusterAchievements * 0.5) + (group[0]?.latestDate ? Date.parse(group[0].latestDate)/1e13 : 0);
          return {
            title,
            summary,
            items: itemsForUi,
            stakeholders: Array.from(stakeholders).slice(0, 6),
            actions,
            metrics: { decisions: clusterDecisions, blockers: clusterBlockers, achievements: clusterAchievements, financial_total: totalFinancial, threads: group.length, urgency_score: urgencyScore }
          };
        }).filter(c => c.items && c.items.length > 0);

        // Sort by urgency descending
        const digest_items = digest_items_unsorted.sort((a, b) => (b.metrics?.urgency_score || 0) - (a.metrics?.urgency_score || 0));

        // Executive summary
        const totalEmails = signalEmails.length;
        const key_insights: string[] = [
          `${digest_items.length} topic clusters identified from ${totalEmails} communications`,
          `Top areas: ${digest_items.slice(0,2).map(d=>d.title).join(' • ')}`,
          `Detected ${digest_items.reduce((a,d)=>a+(d.metrics?.blockers||0),0)} blockers and ${digest_items.reduce((a,d)=>a+(d.metrics?.decisions||0),0)} pending decisions`
        ];

        return {
          executive_summary: { key_insights },
          digest_items,
          processing_metadata: {
            total_emails_processed: totalEmails,
            generated_at: new Date().toISOString(),
            intelligence_engine: 'ExecutiveIntelligenceEngine_v3',
            debug: {
              topic_thresh: SIM_THRESHOLD,
              topic_topn: TOPN,
              topic_bigrams: ENABLE_BIGRAMS,
              clusters: digest_items.map((d: any) => ({ title: d.title, threads: d.metrics?.threads, blockers: d.metrics?.blockers, decisions: d.metrics?.decisions }))
            }
          }
        };
      }

      // If LLM is disabled, return heuristic digest immediately for a fast, useful summary
      if (!useLLM) {
        const heuristic = buildHeuristicDigest();
        return NextResponse.json({
          userId: user?.email,
          generatedAt: heuristic.processing_metadata.generated_at,
          style: 'executive_brief_clustered',
          version: '2.0_clustered_basic',
          dataSource: 'real_clustered',
          executive_summary: heuristic.executive_summary,
          digest_items: heuristic.digest_items,
          processing_metadata: heuristic.processing_metadata,
          availableTimeRanges: ['3days', 'week', 'month']
        });
      }

      // Call Python analysis service for executive intelligence processing
      try {
        console.log(`🧠 GET: Calling Python analysis service with ${unified.emails.length} emails for intelligent processing...`);
        
        // First, use the new email intelligence extraction for filtering and insights
        if (unified.emails.length > 0) {
          try {
            console.log(`🔍 Extracting executive intelligence from ${unified.emails.length} emails...`);
            
            const extractionResponse = await fetch('http://localhost:8000/generate-brief', {
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
                const intelligenceMap = new Map<string, any>(extractionResult.results.map((r: any) => [r.sender as string, r]));
                
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
        
        // Transform emails to the format expected by real intelligence processor
        const emailsForAnalysis = unified.emails.map(email => ({
          id: email.id,
          subject: email.subject || "",
          body: email.body || "",
          from: {
            name: email.from.includes('<') ? email.from.split('<')[0].trim() : email.from,
            email: email.from.includes('<') ? email.from.match(/<(.+)>/)?.[1] || email.from : email.from
          },
          to: Array.isArray(email.to) ? email.to : [email.to || ""],
          date: email.date,
          threadId: email.messageId || email.id,
          snippet: email.body?.substring(0, 150) || ""
        }));

        console.log(`🧠 Calling Python intelligence service with ${emailsForAnalysis.length} emails`);

        const realAnalysisResponse = await fetch(`http://localhost:8000/generate-brief`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            emails: emailsForAnalysis,
            days_back: 7,
            filter_marketing: true,
            // Ensure Python service can switch behavior based on toggle
            use_llm: useLLM,
            include_context_snippets: useLLM,
            generate_recommendations: useLLM,
            return_digest_items: true
          })
        });

        if (realAnalysisResponse.ok) {
          const realIntelligence = await realAnalysisResponse.json();
          console.log(`✅ GET: Real intelligence processing completed:`, realIntelligence.processing_metadata);

          // Check if this is a clustered intelligence response and dashboard needs clustered format
          // If clustered digest items are present, always return clustered format so UI can render topic clusters
          if (realIntelligence.digest_items && realIntelligence.processing_metadata) {
            console.log(`📊 Returning clustered intelligence format with ${realIntelligence.digest_items.length} clusters`);

            // Return clustered format directly for dashboard display
            return NextResponse.json({
              userId: user.email,
              generatedAt: realIntelligence.processing_metadata.generated_at || new Date().toISOString(),
              style: 'executive_brief_clustered',
              version: '2.0_clustered',
              dataSource: 'real_clustered',
              executiveSummary: realIntelligence.executive_summary?.title || `Clustered ${realIntelligence.processing_metadata.total_emails_processed} emails into ${realIntelligence.digest_items.length} topics.`,
              keyInsights: realIntelligence.executive_summary?.key_insights || [
                `Saved an estimated ${Math.floor(realIntelligence.processing_metadata.total_emails_processed * 0.5)} minutes by grouping related emails.`,
                `Identified ${realIntelligence.digest_items.length} key topics from your recent communications.`
              ],
              digest_items: realIntelligence.digest_items,
              processing_metadata: realIntelligence.processing_metadata,
              availableTimeRanges: ['3days', 'week', 'month']
            });
          }

          // Create a map of email IDs to dates
          const emailDateMap = new Map(unified.emails.map(email => [email.id, email.date]));

          // Inject original timestamps back into immediateActions
          if (realIntelligence.missionBrief && realIntelligence.missionBrief.immediateActions) {
            realIntelligence.missionBrief.immediateActions.forEach((action: any) => {
              if (action.messageId) {
                const originalDate = emailDateMap.get(action.messageId);
                if (originalDate) {
                  const d = new Date(originalDate);
                  action.date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  action.time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                }
              }
            });
          }

          // Return the real intelligence brief directly (no more mock data fallbacks)
          return NextResponse.json({
            ...realIntelligence,
            style: 'mission_brief', // Ensure frontend knows it's a mission brief
            userId: user.email,
            dataSource: 'real',
            generatedAt: realIntelligence.processing_metadata?.generated_at || new Date().toISOString(),
            generationParams: {
              style: briefStyle,
              scenario: undefined,
              timeRange
            },
            availableTimeRanges: ['3days', 'week', 'month'],
            // Include clustering results for frontend display
            clustering: clusteringResult ? {
              metrics: clusteringResult.metrics,
              upgrade_suggestions: clusteringResult.upgrade_suggestions,
              processing_time_ms: clusteringResult.processing_time_ms
            } : null
          });
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
      customData,
      useLLM = false
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
        
        // Use TokenManager for clean token handling
        const tokenManager = getTokenManager();
        const tokens = await tokenManager.getTokens(user.id, 'google');

        if (!tokens || !tokens.access_token) {
          throw new Error('No Gmail tokens found - please reconnect Gmail');
        }

        const accessToken = tokens.access_token;
        
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
          
          // Transform emails to the format expected by real intelligence processor
          const emailsForAnalysis = realEmails.map(email => ({
            id: email.id,
            subject: email.subject || "",
            body: email.body || "",
            from: {
              name: email.from.includes('<') ? email.from.split('<')[0].trim() : email.from,
              email: email.from.includes('<') ? email.from.match(/<(.+)>/)?.[1] || email.from : email.from
            },
            to: Array.isArray(email.to) ? email.to : [email.to || ""],
            date: email.date,
            threadId: email.messageId || email.id,
            snippet: email.body?.substring(0, 150) || ""
          }));

          console.log(`🧠 POST: Calling Python intelligence service with ${emailsForAnalysis.length} emails`);

          const realAnalysisResponse = await fetch(`http://localhost:8000/generate-brief`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              emails: emailsForAnalysis,
              days_back: 7,
              filter_marketing: true,
              use_llm_override: useLLM
            })
          });

          if (realAnalysisResponse.ok) {
            const realIntelligence = await realAnalysisResponse.json();
            console.log(`✅ POST: Real intelligence processing completed:`, realIntelligence.processing_metadata);

            // Return the real intelligence brief directly (no more mock data fallbacks)
            return NextResponse.json({
              ...realIntelligence,
              style: 'mission_brief', // Ensure frontend knows it's a mission brief
              userId: user.email,
              dataSource: 'real',
              generatedAt: realIntelligence.processing_metadata?.generated_at || new Date().toISOString(),
              generationParams: {
                style: briefStyle,
                timeRange,
                analysisEngine: 'real_intelligence'
              },
              availableTimeRanges: ['3days', 'week', 'month']
            });
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