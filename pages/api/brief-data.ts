import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedUser } from '@/lib/auth0';
import { UnifiedDataService } from '@/services/unifiedDataService';
import { userTokens } from '@/services/db';
import { OAuth2Client } from 'google-auth-library';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Authenticate the user
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = user.sub;
    const refreshToken = await userTokens.get(userId, 'google');
    
    if (!refreshToken) {
      return res.status(403).json({ 
        message: 'Google account not connected',
        action: 'connect_google'
      });
    }

    // Create OAuth2 client
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Create the unified data service
    const dataService = new UnifiedDataService(oauth2Client);
    
    // Check if we should force a refresh
    const refreshCache = req.query.refresh === 'true';
    
    // Get the data
    const data = await dataService.getBriefData(userId, { refreshCache });
    
    // Set cache headers (5 minutes client-side cache)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    
    return res.status(200).json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error in brief-data API:', error);
    
    // Handle specific error cases
    if (error.message.includes('invalid_grant')) {
      // Token is invalid or revoked, remove it from the database
      try {
        await userTokens.delete(userId, 'google');
      } catch (dbError) {
        console.error('Error removing invalid token:', dbError);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Google authentication expired',
        action: 'reconnect_google'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch brief data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
