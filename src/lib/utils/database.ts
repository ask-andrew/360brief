/**
 * Database utility functions for timestamp handling and validation
 */

/**
 * Converts ISO timestamp to Unix timestamp in seconds for database storage
 * Ensures consistent timestamp format in bigint database fields
 */
export function toDatabaseTimestamp(isoTimestamp: string | number): number {
  if (typeof isoTimestamp === 'number') {
    // If already a number, assume it's in milliseconds and convert to seconds
    return Math.floor(isoTimestamp / 1000);
  }
  
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp format: ${isoTimestamp}`);
  }
  
  return Math.floor(date.getTime() / 1000);
}

/**
 * Converts Unix timestamp (seconds) from database to ISO string
 */
export function fromDatabaseTimestamp(unixSeconds: number): string {
  if (typeof unixSeconds !== 'number' || isNaN(unixSeconds)) {
    throw new Error(`Invalid database timestamp: ${unixSeconds}`);
  }
  
  return new Date(unixSeconds * 1000).toISOString();
}

/**
 * Validates that timestamp data is properly formatted for database storage
 */
export function validateTokenData(tokenData: {
  access_token: string;
  refresh_token?: string;
  expires_at?: any;
  updated_at?: any;
  created_at?: any;
}): {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  updated_at?: number;
  created_at?: number;
} {
  const validated: any = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  };

  // Validate and convert timestamps
  if (tokenData.expires_at !== undefined) {
    try {
      validated.expires_at = toDatabaseTimestamp(tokenData.expires_at);
    } catch (error) {
      console.error('⚠️  Invalid expires_at timestamp:', tokenData.expires_at);
      throw new Error(`Invalid expires_at format: ${tokenData.expires_at}`);
    }
  }

  if (tokenData.updated_at !== undefined) {
    try {
      validated.updated_at = toDatabaseTimestamp(tokenData.updated_at);
    } catch (error) {
      console.error('⚠️  Invalid updated_at timestamp:', tokenData.updated_at);
      throw new Error(`Invalid updated_at format: ${tokenData.updated_at}`);
    }
  }

  if (tokenData.created_at !== undefined) {
    try {
      validated.created_at = toDatabaseTimestamp(tokenData.created_at);
    } catch (error) {
      console.error('⚠️  Invalid created_at timestamp:', tokenData.created_at);
      throw new Error(`Invalid created_at format: ${tokenData.created_at}`);
    }
  }

  return validated;
}

/**
 * Logs database operation for debugging timestamp issues
 */
export function logDatabaseOperation(operation: string, data: any, context?: string) {
  console.log(`🗄️  Database ${operation}${context ? ` (${context})` : ''}:`, {
    timestamp: new Date().toISOString(),
    data: JSON.stringify(data, null, 2),
  });
}