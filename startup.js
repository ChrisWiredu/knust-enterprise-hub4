#!/usr/bin/env node

const { initializeDatabase } = require('./backend/db/init');
const { validateEnvironment, config } = require('./backend/config/env');

async function startup() {
  console.log('🚀 Starting KNUST Enterprise Hub...\n');
  
  try {
    // Validate environment variables first
    console.log('🔧 Validating environment configuration...');
    validateEnvironment();
    
    // Check database connection
    const { Pool } = require('pg');
    const pool = new Pool(config.database);

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📊 Initializing database tables...');
      await initializeDatabase();
      console.log('✅ Database tables created successfully');
    } else {
      console.log('✅ Database tables already exist');
    }
    
    console.log('\n🎉 Setup complete! You can now start the server with:');
    console.log('   npm start     (production)');
    console.log('   npm run dev   (development)');
    console.log(`\n🌐 Server will be available at: http://localhost:${config.server.port}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Please check:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Database credentials in .env file');
    console.log('   3. Database exists (create with: createdb knust_enterprise_hub)');
    console.log('\n📖 See README.md for detailed setup instructions');
    process.exit(1);
  }
}

// Run startup if this file is executed directly
if (require.main === module) {
  startup()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Startup failed:', error);
      process.exit(1);
    });
}

module.exports = { startup };
