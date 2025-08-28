const { Client } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.test' });

const TEST_DB_NAME = '360brief_test';
const TEST_DB_URL = process.env.DATABASE_URL;

async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  // Parse the connection URL
  const url = new URL(TEST_DB_URL.replace('postgresql://', 'postgres://'));
  const config = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port || 5432,
  };

  // Connect to the default postgres database
  const client = new Client({
    ...config,
    database: 'postgres',
  });

  try {
    await client.connect();
    
    // Drop the test database if it exists
    await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
    
    // Create a new test database
    await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
    
    console.log('Test database created successfully');
    
    // Run migrations on the test database
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
      },
      stdio: 'inherit',
    });
    
    console.log('Migrations applied successfully');
    
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

setupTestDatabase();
