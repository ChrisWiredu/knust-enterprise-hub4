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

// Get all businesses with optional filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, location, search } = req.query;

    const whereParts = ['b.is_active = true'];
    const params = [];
    let idx = 0;

    if (category) {
      idx += 1; whereParts.push(`b.category = $${idx}`); params.push(category);
    }
    if (location) {
      idx += 1; whereParts.push(`b.location = $${idx}`); params.push(location);
    }
    if (search) {
      idx += 1; whereParts.push(`(b.name ILIKE $${idx} OR b.description ILIKE $${idx})`); params.push(`%${search}%`);
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT b.*, 
             COUNT(DISTINCT p.id) as product_count,
             AVG(r.rating) as average_rating,
             COUNT(r.id) as review_count
      FROM businesses b
      LEFT JOIN products p ON b.id = p.business_id
      LEFT JOIN reviews r ON b.id = r.business_id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching businesses' });
  }
});

// Get business by ID with embedded products and reviews
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

    const business = result.rows[0];

    // Fetch products and reviews to embed
    const [products, reviews] = await Promise.all([
      pool.query(`SELECT * FROM products WHERE business_id = $1 AND is_available = true ORDER BY created_at DESC`, [id]),
      pool.query(`
        SELECT r.*, u.username, u.first_name, u.last_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.business_id = $1
        ORDER BY r.created_at DESC
        LIMIT 20
      `, [id])
    ]);

    business.products = products.rows;
    business.reviews = reviews.rows;

    res.json(business);
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
      logo_url
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

// Search businesses (legacy)
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

// Business analytics endpoint
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    const [ordersAgg, statusAgg, topProducts, dailyOrders] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total_amount),0)::numeric AS total_revenue,
               COALESCE(AVG(total_amount),0)::numeric AS avg_order_value
        FROM orders WHERE business_id = $1
      `, [id]),
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM orders WHERE business_id = $1
        GROUP BY status
      `, [id]),
      pool.query(`
        SELECT p.id, p.name, SUM(oi.quantity)::int AS total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE p.business_id = $1
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 5
      `, [id]),
      pool.query(`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS orders
        FROM orders
        WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `, [id])
    ]);

    res.json({
      totals: ordersAgg.rows[0],
      ordersByStatus: statusAgg.rows,
      topProducts: topProducts.rows,
      ordersPerDay: dailyOrders.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching analytics' });
  }
});

module.exports = router;
