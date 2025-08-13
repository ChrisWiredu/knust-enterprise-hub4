const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken, authorizeOwner, optionalAuth } = require('../middleware/auth');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'knust_enterprise_hub',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
});

// Get all businesses (public route with optional auth for personalization)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, 
             COUNT(DISTINCT p.id) as product_count,
             AVG(r.rating) as average_rating,
             COUNT(r.id) as review_count
      FROM businesses b
      LEFT JOIN products p ON b.id = p.business_id
      LEFT JOIN reviews r ON b.id = r.business_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching businesses' });
  }
});

// Get business by ID
router.get('/:id', async (req, res) => {
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
      WHERE b.id = $1
      GROUP BY b.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching business' });
  }
});

// Create new business (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      location,
      contact_number,
      whatsapp_link,
      instagram_handle,
      logo_url,
      owner_id
    } = req.body;

    // Use authenticated user's ID as owner
    const actualOwnerId = req.user.id;

    const result = await pool.query(`
      INSERT INTO businesses (name, description, category, location, contact_number, 
                            whatsapp_link, instagram_handle, logo_url, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, description, category, location, contact_number, 
         whatsapp_link, instagram_handle, logo_url, actualOwnerId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating business' });
  }
});

// Update business (requires authentication and ownership)
router.put('/:id', authenticateToken, authorizeOwner('business'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      location,
      contact_number,
      whatsapp_link,
      instagram_handle,
      logo_url
    } = req.body;

    const result = await pool.query(`
      UPDATE businesses 
      SET name = $1, description = $2, category = $3, location = $4,
          contact_number = $5, whatsapp_link = $6, instagram_handle = $7, 
          logo_url = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [name, description, category, location, contact_number, 
         whatsapp_link, instagram_handle, logo_url, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating business' });
  }
});

// Delete business (requires authentication and ownership)
router.delete('/:id', authenticateToken, authorizeOwner('business'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM businesses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({ message: 'Business deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting business' });
  }
});

// Search businesses
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(`
      SELECT b.*, 
             COUNT(DISTINCT p.id) as product_count,
             AVG(r.rating) as average_rating,
             COUNT(r.id) as review_count
      FROM businesses b
      LEFT JOIN products p ON b.id = p.business_id
      LEFT JOIN reviews r ON b.id = r.business_id
      WHERE b.name ILIKE $1 OR b.description ILIKE $1 OR b.category ILIKE $1
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `, [`%${query}%`]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error searching businesses' });
  }
});

module.exports = router;
