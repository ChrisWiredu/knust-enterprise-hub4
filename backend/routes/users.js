const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'knust_enterprise_hub',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, email, first_name, last_name, index_number, 
             hall_of_residence, department, phone_number, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, username, email, first_name, last_name, index_number, 
             hall_of_residence, department, phone_number, created_at
      FROM users
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const {
      username,
      email,
      password_hash,
      first_name,
      last_name,
      index_number,
      hall_of_residence,
      department,
      phone_number
    } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, 
                        index_number, hall_of_residence, department, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, username, email, first_name, last_name, index_number, 
                hall_of_residence, department, phone_number, created_at
    `, [username, email, password_hash, first_name, last_name, 
         index_number, hall_of_residence, department, phone_number]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      hall_of_residence,
      department,
      phone_number
    } = req.body;

    const result = await pool.query(`
      UPDATE users 
      SET first_name = $1, last_name = $2, hall_of_residence = $3, 
          department = $4, phone_number = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING id, username, email, first_name, last_name, index_number, 
                hall_of_residence, department, phone_number, created_at
    `, [first_name, last_name, hall_of_residence, department, phone_number, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Get user businesses
router.get('/:id/businesses', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT b.*, 
             COUNT(DISTINCT p.id) as product_count,
             AVG(r.rating) as average_rating,
             COUNT(r.id) as review_count
      FROM businesses b
      LEFT JOIN products p ON b.id = p.business_id
      LEFT JOIN reviews r ON b.id = r.business_id
      WHERE b.owner_id = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user businesses' });
  }
});

// Get user orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT o.*, b.name as business_name
      FROM orders o
      JOIN businesses b ON o.business_id = b.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user orders' });
  }
});

// User authentication (basic)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // In a real app, you'd hash the password and compare with stored hash
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // For demo purposes, accept any password
    // In production, verify password hash
    res.json({
      message: 'Login successful',
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error during login' });
  }
});

module.exports = router;
