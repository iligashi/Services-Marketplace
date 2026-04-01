require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const categories = [
  { name: 'Plumbing', slug: 'plumbing', description: 'Plumbing repairs, installations, and maintenance' },
  { name: 'Electrical', slug: 'electrical', description: 'Electrical wiring, repairs, and installations' },
  { name: 'Cleaning', slug: 'cleaning', description: 'House cleaning, deep cleaning, and organizing' },
  { name: 'Tutoring', slug: 'tutoring', description: 'Academic tutoring and skill training' },
  { name: 'Painting', slug: 'painting', description: 'Interior and exterior painting services' },
  { name: 'Landscaping', slug: 'landscaping', description: 'Garden maintenance, lawn care, and landscaping' },
  { name: 'Moving', slug: 'moving', description: 'Moving assistance and furniture transport' },
  { name: 'Carpentry', slug: 'carpentry', description: 'Woodwork, furniture repair, and custom builds' },
  { name: 'HVAC', slug: 'hvac', description: 'Heating, ventilation, and air conditioning' },
  { name: 'Appliance Repair', slug: 'appliance-repair', description: 'Repair of home appliances' },
];

async function seed() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  try {
    // Seed categories
    for (const cat of categories) {
      await connection.query(
        'INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [cat.name, cat.slug, cat.description]
      );
    }
    console.log('Categories seeded');

    // Seed admin user
    const adminHash = await bcrypt.hash('admin123', 12);
    await connection.query(
      `INSERT IGNORE INTO users (name, email, password_hash, role, is_verified)
       VALUES (?, ?, ?, 'admin', TRUE)`,
      ['Admin', 'admin@marketplace.local', adminHash]
    );
    console.log('Admin user seeded (admin@marketplace.local / admin123)');

    // Seed demo customer
    const customerHash = await bcrypt.hash('customer123', 12);
    await connection.query(
      `INSERT IGNORE INTO users (name, email, password_hash, role, is_verified)
       VALUES (?, ?, ?, 'customer', TRUE)`,
      ['Jane Customer', 'customer@demo.local', customerHash]
    );
    console.log('Demo customer seeded');

    // Seed demo provider
    const providerHash = await bcrypt.hash('provider123', 12);
    const [provResult] = await connection.query(
      `INSERT IGNORE INTO users (name, email, password_hash, role, is_verified)
       VALUES (?, ?, ?, 'provider', TRUE)`,
      ['John Provider', 'provider@demo.local', providerHash]
    );

    if (provResult.insertId) {
      await connection.query(
        `INSERT IGNORE INTO provider_profiles (user_id, bio, skills, years_experience, service_radius_km, location_lat, location_lng, location_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          provResult.insertId,
          'Experienced plumber and electrician with 10+ years of service.',
          JSON.stringify(['plumbing', 'electrical', 'hvac']),
          10,
          30,
          40.7128,
          -74.0060,
          'New York, NY',
        ]
      );
    }
    console.log('Demo provider seeded');

    console.log('\nSeeding complete!');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
