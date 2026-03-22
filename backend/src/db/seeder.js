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

    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (!adminEmail || !adminPassword) {
      throw new Error('INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set in .env');
    }

    // 1. Ensure Admin role exists
    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'Admin'");
    if (roleRes.rows.length === 0) {
      throw new Error('Admin role not found in roles table. Please run the schema script first.');
    }
    const adminRoleId = roleRes.rows[0].id;

    // 2. Create Super Admin User
    const userRes = await client.query(
      `INSERT INTO users (email, password, name, status) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, status = EXCLUDED.status
       RETURNING id`,
      [adminEmail, hashedPassword, 'Super Admin', 'ACTIVE']
    );
    const userId = userRes.rows[0].id;

    // 3. Assign Admin role to user
    await client.query(
      `INSERT INTO user_roles (user_id, role_id) 
       VALUES ($1, $2) 
       ON CONFLICT DO NOTHING`,
      [userId, adminRoleId]
    );

    // 4. Initialize Landing Page content
    await client.query(
      `INSERT INTO landing_page_config (hero_text, cta_text, image_url)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      ['Welcome to AppStack', 'Get Started', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832']
    );

    // 5. Initialize Site Name
    await client.query(
      `INSERT INTO system_settings (key, value)
       VALUES ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [
        'site_name', 'WhatsApp Web Tool', 
        'ai_enabled', 'false', 
        'ai_provider', 'gemini',
        'ai_custom_prompt', 'You are a helpful community assistant for WhatsApp Web Tool. Keep responses concise and professional.',
        'ai_model', 'gemini-1.5-flash'
      ]
    );

    console.log(`Super Admin seeded successfully: ${adminEmail}`);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  } finally {
    await client.end();
  }
};

seedAdmin();
