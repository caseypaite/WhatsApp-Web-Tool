require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const applySchema = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const schemaPath = path.join(__dirname, 'acl_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.connect();
    console.log('Connected to database for schema sync...');
    await client.query(schemaSql);
    console.log('Database schema synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database schema:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
};

applySchema();
