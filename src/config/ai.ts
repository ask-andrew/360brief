// Load environment variables with proper type checking
const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    console.warn(`Warning: Environment variable ${key} is not set`);
    return '';
  }
  return value;
};

export const AI_CONFIG = {
  providers: {
    gemini: {
      apiKey: getEnvVar('GEMINI_API_KEY'),
      model: 'gemini-2.0-flash-lite',
      enabled: true
    },
    mistral: {
      apiKey: getEnvVar('MISTRAL_API_KEY'),
      model: 'mistral-tiny',
      enabled: true
    }
  },
  defaultProvider: 'gemini' as const
} as const;
