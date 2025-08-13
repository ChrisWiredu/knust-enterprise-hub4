// Environment configuration and validation
require('dotenv').config();

const requiredEnvVars = [
  'DB_USER',
  'DB_HOST', 
  'DB_NAME',
  'DB_PASSWORD',
  'DB_PORT',
  'PORT'
];

const validateEnvironment = () => {
  const missingVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('📄 Copy from env.example if needed: cp env.example .env\n');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
};

const config = {
  database: {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
  },
  server: {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production',
  }
};

module.exports = {
  validateEnvironment,
  config
};