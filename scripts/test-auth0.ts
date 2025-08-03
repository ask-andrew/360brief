import * as dotenv from 'dotenv';
import { URL } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

function validateEnvironmentVariables() {
  // Verify required environment variables
  const requiredVars = {
    // Server-side variables
    'AUTH0_SECRET': '🔒 Secret used to encrypt the session cookie',
    'AUTH0_ISSUER_BASE_URL': '🌐 Base URL of the Auth0 tenant domain',
    'AUTH0_BASE_URL': '🏠 Base URL of your application',
    'AUTH0_CLIENT_ID': '🆔 Auth0 Client ID',
    'AUTH0_CLIENT_SECRET': '🔑 Auth0 Client Secret',
    'AUTH0_AUDIENCE': '🎯 Auth0 API Audience',
    
    // Client-side variables
    'NEXT_PUBLIC_AUTH0_DOMAIN': '🌍 Auth0 domain for client-side',
    'NEXT_PUBLIC_AUTH0_CLIENT_ID': '🆔 Client ID for client-side',
    'NEXT_PUBLIC_AUTH0_AUDIENCE': '🎯 API Audience for client-side',
    'NEXT_PUBLIC_AUTH0_BASE_URL': '🏠 Base URL for client-side redirects'
  };

  console.log('=== Environment Variables Check ===');
  let allVarsPresent = true;
  
  for (const [varName, description] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    const isPresent = !!value;
    const status = isPresent ? '✅' : '❌';
    
    // For sensitive values, only show the first few characters
    const displayValue = !isPresent ? 'MISSING' : 
      (varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD'))
        ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}`
        : value;
    
    console.log(`${status} ${varName}: ${displayValue} (${description})`);
    
    if (!isPresent) {
      allVarsPresent = false;
    }
  }
  
  return allVarsPresent;
}

function validateUrls() {
  console.log('\n=== URL Validation ===');
  let allUrlsValid = true;
  
  const urlsToCheck = [
    { name: 'AUTH0_ISSUER_BASE_URL', value: process.env.AUTH0_ISSUER_BASE_URL },
    { name: 'AUTH0_BASE_URL', value: process.env.AUTH0_BASE_URL },
    { name: 'NEXT_PUBLIC_AUTH0_BASE_URL', value: process.env.NEXT_PUBLIC_AUTH0_BASE_URL }
  ];
  
  for (const { name, value } of urlsToCheck) {
    if (!value) continue;
    
    try {
      const url = new URL(value);
      console.log(`✅ ${name} is a valid URL: ${url.toString()}`);
    } catch (error: unknown) {
      console.error(`❌ ${name} is not a valid URL: ${value}`);
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
      } else {
        console.error(`   Error: ${String(error)}`);
      }
      allUrlsValid = false;
    }
  }
  
  return allUrlsValid;
}

function validateAuth0Configuration() {
  console.log('\n=== Auth0 Configuration Validation ===');
  let configValid = true;
  
  // Check if client IDs match between server and client configs
  if (process.env.AUTH0_CLIENT_ID && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_ID !== process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID) {
    console.warn('⚠️  Warning: AUTH0_CLIENT_ID and NEXT_PUBLIC_AUTH0_CLIENT_ID do not match');
    console.warn('   This might be intentional if using different client IDs for server and client');
  }
  
  // Check if domains match between server and client configs
  const serverDomain = process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '');
  const clientDomain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  
  if (serverDomain && clientDomain && serverDomain !== clientDomain) {
    console.warn(`⚠️  Warning: AUTH0_ISSUER_BASE_URL (${serverDomain}) and NEXT_PUBLIC_AUTH0_DOMAIN (${clientDomain}) do not match`);
  }
  
  // Check if audience matches
  if (process.env.AUTH0_AUDIENCE && process.env.NEXT_PUBLIC_AUTH0_AUDIENCE &&
      process.env.AUTH0_AUDIENCE !== process.env.NEXT_PUBLIC_AUTH0_AUDIENCE) {
    console.warn('⚠️  Warning: AUTH0_AUDIENCE and NEXT_PUBLIC_AUTH0_AUDIENCE do not match');
  }
  
  console.log('✅ Auth0 configuration validation complete');
  return configValid;
}

async function main() {
  try {
    // Check environment variables
    const envVarsValid = validateEnvironmentVariables();
    if (!envVarsValid) {
      console.error('\n❌ Some required environment variables are missing');
      return;
    }
    
    // Validate URLs
    const urlsValid = validateUrls();
    if (!urlsValid) {
      console.error('\n❌ Some URLs are invalid');
      return;
    }
    
    // Validate Auth0 configuration
    validateAuth0Configuration();
    
    console.log('\n✅ Auth0 configuration appears to be valid');
    console.log('\nNext steps:');
    console.log('1. Verify that the callback URLs in your Auth0 dashboard include:');
    console.log(`   - ${process.env.AUTH0_BASE_URL}/api/auth/callback`);
    console.log(`   - ${process.env.AUTH0_BASE_URL}/dashboard`);
    console.log('2. Make sure your Auth0 application is configured as a "Regular Web Application"');
    console.log('3. Ensure "Token Endpoint Authentication Method" is set to "None" (PKCE)');
    console.log('4. Test the login flow in your browser');
    
  } catch (error) {
    console.error('❌ Error testing Auth0 configuration:');
    console.error(error);
  }
}

main();
