/**
 * Standardized timestamp utilities for 360Brief
 * 
 * Database stores Unix timestamps as bigint (seconds since epoch)
 * Application uses JavaScript Date objects and ISO strings
 * APIs may return various timestamp formats
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
 * Database-safe timestamp for insertion
 * @param timestamp Any timestamp format
 * @returns Unix timestamp in seconds or null
 */
export function toDatabaseTimestamp(timestamp: any = new Date()): number | null {
  return toUnixTimestamp(timestamp);
}

/**
 * Convert database timestamp to displayable format
 * @param dbTimestamp Unix timestamp from database
 * @returns Formatted date string
 */
export function fromDatabaseTimestamp(dbTimestamp: number | string | null): string {
  const date = fromUnixTimestamp(dbTimestamp);
  return date ? date.toLocaleString() : 'Unknown';
}