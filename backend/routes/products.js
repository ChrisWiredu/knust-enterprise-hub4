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

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, b.name as business_name, b.location as business_location
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, b.name as business_name, b.location as business_location
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// Get products by business
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const result = await pool.query(`
      SELECT p.*, b.name as business_name, b.location as business_location
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      WHERE p.business_id = $1
      ORDER BY p.created_at DESC
    `, [businessId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching business products' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image_url,
      business_id,
      category,
      stock_quantity,
      is_available
    } = req.body;

    const result = await pool.query(`
      INSERT INTO products (name, description, price, image_url, business_id, 
                           category, stock_quantity, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description, price, image_url, business_id, 
         category, stock_quantity, is_available]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      image_url,
      category,
      stock_quantity,
      is_available
    } = req.body;

    const result = await pool.query(`
      UPDATE products 
      SET name = $1, description = $2, price = $3, image_url = $4,
          category = $5, stock_quantity = $6, is_available = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [name, description, price, image_url, category, stock_quantity, is_available, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(`
      SELECT p.*, b.name as business_name, b.location as business_location
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      WHERE p.name ILIKE $1 OR p.description ILIKE $1 OR p.category ILIKE $1
      ORDER BY p.created_at DESC
    `, [`%${query}%`]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error searching products' });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(`
      SELECT p.*, b.name as business_name, b.location as business_location
      FROM products p
      JOIN businesses b ON p.business_id = b.id
      WHERE p.category = $1
      ORDER BY p.created_at DESC
    `, [category]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching products by category' });
  }
});

module.exports = router;
