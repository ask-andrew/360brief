/**
 * Standardized timestamp utilities for 360Brief
 * 
 * Database stores timestamps as TIMESTAMPTZ (ISO format)
 * Application uses JavaScript Date objects and ISO strings
 * OAuth APIs may return Unix timestamps (seconds or milliseconds)
 */

/**
 * Convert various timestamp formats to Unix timestamp (seconds since epoch)
 * @param timestamp Any timestamp format
 * @returns Unix timestamp in seconds, or null if invalid
 */
export function toUnixTimestamp(timestamp: any): number | null {
  if (!timestamp) return null;
  
  // If already a number, assume it's either seconds or milliseconds
  if (typeof timestamp === 'number') {
    // If it looks like milliseconds (> year 2100), convert to seconds
    return timestamp > 4102444800 ? Math.floor(timestamp / 1000) : timestamp;
  }
  
  // If it's a string that might be a number
  if (typeof timestamp === 'string') {
    const numTimestamp = parseFloat(timestamp);
    if (!isNaN(numTimestamp)) {
      return numTimestamp > 4102444800 ? Math.floor(numTimestamp / 1000) : numTimestamp;
    }
    
    // Try to parse as ISO string
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return Math.floor(date.getTime() / 1000);
    }
  }
  
  // If it's a Date object
  if (timestamp instanceof Date) {
    return Math.floor(timestamp.getTime() / 1000);
  }
  
  return null;
}

/**
 * Convert Unix timestamp (seconds) to JavaScript Date
 * @param unixTimestamp Unix timestamp in seconds
 * @returns Date object or null if invalid
 */
export function fromUnixTimestamp(unixTimestamp: number | string | null): Date | null {
  if (!unixTimestamp) return null;
  
  const timestamp = typeof unixTimestamp === 'string' ? parseFloat(unixTimestamp) : unixTimestamp;
  if (isNaN(timestamp)) return null;
  
  // Convert seconds to milliseconds for Date constructor
  const date = new Date(timestamp * 1000);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convert any timestamp format to ISO string
 * @param timestamp Any timestamp format
 * @returns ISO string or current time if invalid
 */
export function toISOString(timestamp: any): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  
  // If it's already a valid ISO string, return it
  if (typeof timestamp === 'string' && !isNaN(Date.parse(timestamp))) {
    return new Date(timestamp).toISOString();
  }
  
  // Convert to Unix timestamp first, then to Date
  const unixTimestamp = toUnixTimestamp(timestamp);
  if (unixTimestamp) {
    const date = fromUnixTimestamp(unixTimestamp);
    if (date) {
      return date.toISOString();
    }
  }
  
  console.warn(`⚠️ Invalid timestamp format: ${timestamp}, using current time`);
  return new Date().toISOString();
}

/**
 * Get current Unix timestamp in seconds
 * @returns Current Unix timestamp in seconds
 */
export function nowUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check if a timestamp is expired (for token validation)
 * @param expiresAt Unix timestamp in seconds when token expires
 * @returns true if expired, false if still valid
 */
export function isExpired(expiresAt: number | string | null): boolean {
  if (!expiresAt) return false; // No expiration means never expires
  
  const expiry = typeof expiresAt === 'string' ? parseFloat(expiresAt) : expiresAt;
  if (isNaN(expiry)) return false;
  
  return expiry < nowUnixTimestamp();
}

/**
 * Database-safe timestamp for insertion (Unix seconds for bigint columns)
 * @param timestamp Any timestamp format
 * @returns Unix timestamp in seconds or null
 */
export function toDatabaseTimestamp(timestamp: any = new Date()): number | null {
  if (!timestamp) return null;
  
  // Handle Google OAuth expiry_date (Unix milliseconds)
  if (typeof timestamp === 'number') {
    // Normalize milliseconds to seconds if needed
    return normalizeToSeconds(timestamp);
  }
  
  // Handle ISO strings
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) ? Math.floor(date.getTime() / 1000) : null;
  }
  
  // Handle Date objects
  if (timestamp instanceof Date) {
    return !isNaN(timestamp.getTime()) ? Math.floor(timestamp.getTime() / 1000) : null;
  }
  
  return null;
}

/**
 * Normalize timestamp from milliseconds to seconds if needed
 * @param timestamp Unix timestamp (could be seconds or milliseconds)
 * @returns Unix timestamp in seconds
 */
export function normalizeToSeconds(timestamp: number): number {
  // If timestamp is in milliseconds (> year 2100 - 4102444800 seconds), convert to seconds
  // This threshold safely distinguishes between seconds and milliseconds
  if (timestamp > 4102444800) {
    return Math.floor(timestamp / 1000);
  }
  // Already in seconds (or it's a very old timestamp)
  return Math.floor(timestamp);
}

/**
 * Convert database timestamp to displayable format
 * @param dbTimestamp TIMESTAMPTZ from database (ISO string)
 * @returns Formatted date string
 */
export function fromDatabaseTimestamp(dbTimestamp: string | null): string {
  if (!dbTimestamp) return 'Unknown';
  const date = new Date(dbTimestamp);
  return !isNaN(date.getTime()) ? date.toLocaleString() : 'Unknown';
}

/**
 * Check if a database timestamp is expired
 * @param expiresAt Unix timestamp from database (number) or ISO string (legacy)
 * @returns true if expired, false if still valid
 */
export function isDatabaseTimestampExpired(expiresAt: number | string | null): boolean {
  if (!expiresAt) return false;
  
  let expiryMs: number;
  
  if (typeof expiresAt === 'number') {
    // Unix timestamp in seconds, convert to milliseconds
    expiryMs = expiresAt * 1000;
  } else if (typeof expiresAt === 'string') {
    // Could be Unix timestamp as string or ISO string
    const numValue = parseFloat(expiresAt);
    if (!isNaN(numValue)) {
      // It's a numeric string (Unix timestamp)
      expiryMs = numValue * 1000;
    } else {
      // Try as ISO string
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) return false;
      expiryMs = expiryDate.getTime();
    }
  } else {
    return false;
  }
  
  return expiryMs < Date.now();
}

/**
 * Check if a database timestamp is near expiry (within buffer minutes)
 * @param expiresAt Unix timestamp from database (number) or ISO string (legacy)
 * @param bufferMinutes Minutes before expiry to consider "near expiry" (default 10)
 * @returns true if expires within buffer time, false otherwise
 */
export function isTokenNearExpiry(expiresAt: number | string | null, bufferMinutes: number = 10): boolean {
  if (!expiresAt) return false;
  
  let expiryMs: number;
  
  if (typeof expiresAt === 'number') {
    // Unix timestamp in seconds, convert to milliseconds
    expiryMs = expiresAt * 1000;
  } else if (typeof expiresAt === 'string') {
    // Could be Unix timestamp as string or ISO string
    const numValue = parseFloat(expiresAt);
    if (!isNaN(numValue)) {
      // It's a numeric string (Unix timestamp)
      expiryMs = numValue * 1000;
    } else {
      // Try as ISO string
      const expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) return false;
      expiryMs = expiryDate.getTime();
    }
  } else {
    return false;
  }
  
  const bufferMs = bufferMinutes * 60 * 1000;
  const thresholdTime = Date.now() + bufferMs;
  
  return expiryMs < thresholdTime;
}

