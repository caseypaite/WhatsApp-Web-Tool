require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database for seeding...');

    // 1. Seed Roles (Essential for system to function)
    console.log('Seeding roles...');
    await client.query(`
      INSERT INTO roles (name, description) VALUES 
      ('SuperAdmin', 'Unrestricted administrative access to all systems.'),
      ('Admin', 'Full access to the system, including user management and CMS.'),
      ('Editor', 'Access to CMS and content updates.'),
      ('User', 'Standard user access to application features.')
      ON CONFLICT (name) DO NOTHING
    `);

    // 2. Seed Admin User from .env
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set in .env');
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'Admin'");
    const adminRoleId = roleRes.rows[0].id;

    console.log(`Seeding admin account: ${adminEmail}`);
    const userRes = await client.query(
      `INSERT INTO users (email, password, name, status) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, status = EXCLUDED.status
       RETURNING id`,
      [adminEmail, hashedPassword, 'Super Admin', 'ACTIVE']
    );
    const userId = userRes.rows[0].id;

    await client.query(
      `INSERT INTO user_roles (user_id, role_id) 
       VALUES ($1, $2) 
       ON CONFLICT DO NOTHING`,
      [userId, adminRoleId]
    );

    // 3. Initialize minimum required settings if they don't exist
    const websiteDomain = process.env.WEBSITE_DOMAIN || 'localhost:3085';
    const protocol = websiteDomain.includes('localhost') ? 'http' : 'https';
    const backendUrl = websiteDomain.startsWith('http') 
      ? (websiteDomain.endsWith('/api') ? websiteDomain : `${websiteDomain}/api`)
      : `${protocol}://${websiteDomain}/api`;

    console.log(`Seeding initial settings with backend URL: ${backendUrl}`);

    await client.query(
      `INSERT INTO system_settings (key, value)
       VALUES ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10)
       ON CONFLICT (key) DO NOTHING`,
      [
        'site_name', 'WhatsApp Web Tool',
        'website_domain', websiteDomain,
        'vite_api_base_url', backendUrl,
        'ai_enabled', 'false',
        'ai_custom_prompt', 'You are a helpful assistant for the AppStack platform.'
      ]
    );

    // Initial landing page config
    await client.query(
      `INSERT INTO landing_page_config (hero_text, cta_text, image_url)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      ['Distributed Identity Protocol', 'Get Started', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832']
    );

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  } finally {
    await client.end();
  }
};

seedAdmin();
