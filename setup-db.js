import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Create a connection to PostgreSQL (without specifying database)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'postgres' // Connect to default postgres database first
});

async function setupDatabase() {
  try {
    // Create database if it doesn't exist
    await pool.query(`CREATE DATABASE ${process.env.DB_NAME || 'blog_app'}`);
    console.log('Database created successfully');
    
    // Close the current connection
    await pool.end();
    
    // Connect to the new database
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'blog_app',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });
    
    // Create the blogs table
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        snippet VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index for better performance
    await appPool.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC)
    `);
    
    // Create trigger function for updated_at
    await appPool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    // Create trigger
    await appPool.query(`
      DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
      CREATE TRIGGER update_blogs_updated_at 
          BEFORE UPDATE ON blogs 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
    `);
    
    console.log('Database schema created successfully');
    await appPool.end();
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Database already exists, skipping creation');
    } else {
      console.error('Error setting up database:', error);
    }
  }
}

setupDatabase();
