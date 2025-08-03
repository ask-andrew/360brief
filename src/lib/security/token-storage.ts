import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

// This should be stored in an environment variable in production
const ENCRYPTION_SECRET = process.env.TOKEN_ENCRYPTION_SECRET || 'default-secret-key-for-development';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const SALT = '360brief-salt';

// Derive a key from the secret using PBKDF2
const getKey = (): Buffer => {
  return pbkdf2Sync(ENCRYPTION_SECRET, SALT, 100000, 32, 'sha256');
};

/**
 * Encrypts a token for secure storage
 * @param token The token to encrypt
 * @returns Encrypted token with IV as base64 string
 */
export function encryptToken(token: string): string {
  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data with a separator
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Error encrypting token:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypts a token that was previously encrypted
 * @param encryptedToken The encrypted token with IV
 * @returns Decrypted token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const [ivHex, encrypted] = encryptedToken.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted token format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting token:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Securely stores tokens in the database by encrypting them first
 * @param tokens The tokens to store
 * @returns Encrypted tokens
 */
export function secureTokensForStorage(tokens: {
  access_token: string;
  refresh_token: string;
  [key: string]: any;
}) {
  return {
    ...tokens,
    access_token: encryptToken(tokens.access_token),
    refresh_token: encryptToken(tokens.refresh_token),
  };
}

/**
 * Decrypts tokens retrieved from the database
 * @param encryptedTokens The encrypted tokens from storage
 * @returns Decrypted tokens
 */
export function decryptStoredTokens(encryptedTokens: {
  access_token: string;
  refresh_token: string;
  [key: string]: any;
}) {
  try {
    return {
      ...encryptedTokens,
      access_token: decryptToken(encryptedTokens.access_token),
      refresh_token: decryptToken(encryptedTokens.refresh_token),
    };
  } catch (error) {
    console.error('Error decrypting stored tokens:', error);
    throw new Error('Failed to decrypt stored tokens');
  }
}

/**
 * Creates a secure token storage wrapper that encrypts/decrypts tokens automatically
 */
export function createSecureTokenStorage(storage: Storage) {
  return {
    setItem: (key: string, value: string) => {
      try {
        const data = JSON.parse(value);
        if (data.access_token || data.refresh_token) {
          const secureData = secureTokensForStorage({
            access_token: data.access_token || '',
            refresh_token: data.refresh_token || '',
            ...data,
          });
          storage.setItem(key, JSON.stringify(secureData));
        } else {
          storage.setItem(key, value);
        }
      } catch (error) {
        // If not JSON or encryption fails, store as is
        storage.setItem(key, value);
      }
    },
    getItem: (key: string): string | null => {
      const item = storage.getItem(key);
      if (!item) return null;
      
      try {
        const data = JSON.parse(item);
        if (data.access_token || data.refresh_token) {
          const decrypted = decryptStoredTokens({
            access_token: data.access_token || '',
            refresh_token: data.refresh_token || '',
            ...data,
          });
          return JSON.stringify(decrypted);
        }
        return item;
      } catch (error) {
        // If not JSON or decryption fails, return as is
        return item;
      }
    },
    removeItem: (key: string) => storage.removeItem(key),
    clear: () => storage.clear(),
    key: (index: number) => storage.key(index),
    length: storage.length,
  };
}

// Secure storage instances
export const secureSessionStorage = 
  typeof window !== 'undefined' ? createSecureTokenStorage(window.sessionStorage) : null;

export const secureLocalStorage = 
  typeof window !== 'undefined' ? createSecureTokenStorage(window.localStorage) : null;

/**
 * Secure cookie storage for tokens
 */
export const secureCookieStorage = {
  set: (name: string, value: string, days = 7) => {
    try {
      const data = JSON.parse(value);
      if (data.access_token || data.refresh_token) {
        const secureData = secureTokensForStorage({
          access_token: data.access_token || '',
          refresh_token: data.refresh_token || '',
          ...data,
        });
        value = JSON.stringify(secureData);
      }
    } catch (error) {
      // If not JSON, continue with original value
    }
    
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
  },
  get: (name: string): string | null => {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
        try {
          const data = JSON.parse(value);
          if (data.access_token || data.refresh_token) {
            const decrypted = decryptStoredTokens({
              access_token: data.access_token || '',
              refresh_token: data.refresh_token || '',
              ...data,
            });
            return JSON.stringify(decrypted);
          }
        } catch (error) {
          // If not JSON or decryption fails, return as is
        }
        return value;
      }
    }
    return null;
  },
  remove: (name: string) => {
    document.cookie = `${name}=; Max-Age=-99999999; path=/;`;
  },
};
