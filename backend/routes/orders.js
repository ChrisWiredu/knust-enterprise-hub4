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

// Get all orders
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, u.first_name, u.last_name, b.name as business_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN businesses b ON o.business_id = b.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT o.*, u.first_name, u.last_name, b.name as business_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN businesses b ON o.business_id = b.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items
    const orderItems = await pool.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    
    const order = result.rows[0];
    order.items = orderItems.rows;
    
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching order' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      user_id,
      business_id,
      items,
      total_amount,
      delivery_address,
      delivery_instructions,
      payment_method
    } = req.body;

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, business_id, total_amount, delivery_address, 
                         delivery_instructions, payment_method, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `, [user_id, business_id, total_amount, delivery_address, 
         delivery_instructions, payment_method]);

    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [order.id, item.product_id, item.quantity, item.unit_price]);
      
      // Update product stock
      await client.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity - $1
        WHERE id = $2
      `, [item.quantity, item.product_id]);
    }

    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Order created successfully',
      order: order
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error creating order' });
  } finally {
    client.release();
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(`
      UPDATE orders 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating order status' });
  }
});

// Cancel order
router.put('/:id/cancel', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;

    // Get order items to restore stock
    const orderItems = await client.query(`
      SELECT product_id, quantity FROM order_items WHERE order_id = $1
    `, [id]);

    // Restore product stock
    for (const item of orderItems.rows) {
      await client.query(`
        UPDATE products 
        SET stock_quantity = stock_quantity + $1
        WHERE id = $2
      `, [item.quantity, item.product_id]);
    }

    // Update order status
    const result = await client.query(`
      UPDATE orders 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await client.query('COMMIT');
    
    res.json({
      message: 'Order cancelled successfully',
      order: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error cancelling order' });
  } finally {
    client.release();
  }
});

// Get orders by business
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const result = await pool.query(`
      SELECT o.*, u.first_name, u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.business_id = $1
      ORDER BY o.created_at DESC
    `, [businessId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching business orders' });
  }
});

// Get orders by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT o.*, b.name as business_name
      FROM orders o
      JOIN businesses b ON o.business_id = b.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching user orders' });
  }
});

// Delete order (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting order' });
  }
});

module.exports = router;
