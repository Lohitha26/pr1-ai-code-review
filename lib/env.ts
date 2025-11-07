/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at startup to prevent
 * runtime errors and provide clear error messages.
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_URL: string;
  
  // NextAuth
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  
  // GitHub OAuth
  GITHUB_ID: string;
  GITHUB_SECRET: string;
  
  // OpenAI
  OPENAI_API_KEY: string;
  
  // Optional
  NEXT_PUBLIC_SOCKET_URL?: string;
  NODE_ENV?: string;
}

/**
 * List of placeholder values that should not be used in production
 */
const PLACEHOLDER_VALUES = [
  'your-github-oauth-app-id',
  'your-github-oauth-app-secret',
  'your-secret-key-here',
  'your-secret-key-here-generate-with-openssl-rand-base64-32',
  'sk-your-openai-api-key-here',
  'user:password@localhost',
];

/**
 * Check if a value is a placeholder
 */
function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return PLACEHOLDER_VALUES.some(placeholder => 
    value.toLowerCase().includes(placeholder.toLowerCase())
  );
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(
  name: keyof EnvConfig,
  value: string | undefined,
  required: boolean = true
): string | undefined {
  // Check if variable exists
  if (!value || value.trim() === '') {
    if (required) {
      throw new Error(
        `Missing required environment variable: ${name}\n` +
        `Please set this in your .env file. See .env.example for reference.`
      );
    }
    return undefined;
  }

  // Check if it's a placeholder value
  if (isPlaceholder(value)) {
    throw new Error(
      `Environment variable ${name} contains a placeholder value: "${value}"\n` +
      `Please replace it with a real value in your .env file.\n` +
      `See .env.example and documentation for setup instructions.`
    );
  }

  return value;
}

/**
 * Validate all required environment variables
 * Throws an error if any required variable is missing or invalid
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  try {
    const config: EnvConfig = {
      DATABASE_URL: validateEnvVar('DATABASE_URL', process.env.DATABASE_URL)!,
      REDIS_URL: validateEnvVar('REDIS_URL', process.env.REDIS_URL)!,
      NEXTAUTH_URL: validateEnvVar('NEXTAUTH_URL', process.env.NEXTAUTH_URL)!,
      NEXTAUTH_SECRET: validateEnvVar('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET)!,
      GITHUB_ID: validateEnvVar('GITHUB_ID', process.env.GITHUB_ID)!,
      GITHUB_SECRET: validateEnvVar('GITHUB_SECRET', process.env.GITHUB_SECRET)!,
      OPENAI_API_KEY: validateEnvVar('OPENAI_API_KEY', process.env.OPENAI_API_KEY)!,
      NEXT_PUBLIC_SOCKET_URL: validateEnvVar('NEXT_PUBLIC_SOCKET_URL', process.env.NEXT_PUBLIC_SOCKET_URL, false),
      NODE_ENV: process.env.NODE_ENV,
    };

    return config;
  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      '\n' + '='.repeat(80) + '\n' +
      '❌ ENVIRONMENT CONFIGURATION ERROR\n' +
      '='.repeat(80) + '\n\n' +
      errors.join('\n\n') + '\n\n' +
      '='.repeat(80) + '\n' +
      'Setup Instructions:\n' +
      '1. Copy .env.example to .env: cp .env.example .env\n' +
      '2. Fill in all required values in .env\n' +
      '3. For GitHub OAuth: https://github.com/settings/developers\n' +
      '4. For OpenAI API: https://platform.openai.com/api-keys\n' +
      '5. Generate NEXTAUTH_SECRET: openssl rand -base64 32\n' +
      '='.repeat(80) + '\n'
    );
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Environment validation failed');
}

/**
 * Get validated environment config
 * Safe to use after validateEnv() has been called
 */
export function getEnv(): EnvConfig {
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    GITHUB_ID: process.env.GITHUB_ID!,
    GITHUB_SECRET: process.env.GITHUB_SECRET!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
}
