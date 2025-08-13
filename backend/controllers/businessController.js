const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'knust_enterprise_hub',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
});

class BusinessController {
  // Get all businesses with pagination and filtering
  static async getAllBusinesses(req, res) {
    try {
      const { page = 1, limit = 10, category, location, search } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE b.is_active = true';
      let params = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        whereClause += ` AND b.category = $${paramCount}`;
        params.push(category);
      }

      if (location) {
        paramCount++;
        whereClause += ` AND b.location = $${paramCount}`;
        params.push(location);
      }

      if (search) {
        paramCount++;
        whereClause += ` AND (b.name ILIKE $${paramCount} OR b.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      const countQuery = `
        SELECT COUNT(*) 
        FROM businesses b 
        ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      const query = `
        SELECT b.*, 
               COUNT(DISTINCT p.id) as product_count,
               AVG(r.rating) as average_rating,
               COUNT(r.id) as review_count,
               u.first_name, u.last_name
        FROM businesses b
        LEFT JOIN products p ON b.id = p.business_id
        LEFT JOIN reviews r ON b.id = r.business_id
        LEFT JOIN users u ON b.owner_id = u.id
        ${whereClause}
        GROUP BY b.id, u.first_name, u.last_name
        ORDER BY b.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      params.push(limit, offset);
      const result = await pool.query(query, params);

      res.json({
        businesses: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching businesses' });
    }
  }

  // Get business by ID with detailed information
  static async getBusinessById(req, res) {
    try {
      const { id } = req.params;
      
      // Get business details
      const businessResult = await pool.query(`
        SELECT b.*, 
               u.first_name, u.last_name, u.username,
               COUNT(DISTINCT p.id) as product_count,
               AVG(r.rating) as average_rating,
               COUNT(r.id) as review_count
        FROM businesses b
        LEFT JOIN users u ON b.owner_id = u.id
        LEFT JOIN products p ON b.id = p.business_id
        LEFT JOIN reviews r ON b.id = r.business_id
        WHERE b.id = $1 AND b.is_active = true
        GROUP BY b.id, u.first_name, u.last_name, u.username
      `, [id]);

      if (businessResult.rows.length === 0) {
        return res.status(404).json({ error: 'Business not found' });
      }

      const business = businessResult.rows[0];

      // Get business products
      const productsResult = await pool.query(`
        SELECT * FROM products 
        WHERE business_id = $1 AND is_available = true
        ORDER BY created_at DESC
      `, [id]);

      // Get business reviews
      const reviewsResult = await pool.query(`
        SELECT r.*, u.first_name, u.last_name, u.username
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.business_id = $1
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [id]);

      business.products = productsResult.rows;
      business.reviews = reviewsResult.rows;

      res.json(business);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching business' });
    }
  }

  // Create new business
  static async createBusiness(req, res) {
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

      // Validate required fields
      if (!name || !description || !category || !location || !contact_number || !owner_id) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['name', 'description', 'category', 'location', 'contact_number', 'owner_id']
        });
      }

      // Check if user exists
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [owner_id]);
      if (userResult.rows.length === 0) {
        return res.status(400).json({ error: 'User not found' });
      }

      // Check if user already has a business
      const existingBusiness = await pool.query(
        'SELECT id FROM businesses WHERE owner_id = $1 AND is_active = true',
        [owner_id]
      );
      if (existingBusiness.rows.length > 0) {
        return res.status(400).json({ error: 'User already has an active business' });
      }

      const result = await pool.query(`
        INSERT INTO businesses (name, description, category, location, contact_number, 
                              whatsapp_link, instagram_handle, logo_url, owner_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [name, description, category, location, contact_number, 
           whatsapp_link, instagram_handle, logo_url, owner_id]);

      res.status(201).json({
        message: 'Business created successfully',
        business: result.rows[0]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating business' });
    }
  }

  // Update business
  static async updateBusiness(req, res) {
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

      // Check if business exists
      const existingBusiness = await pool.query(
        'SELECT id, owner_id FROM businesses WHERE id = $1 AND is_active = true',
        [id]
      );
      
      if (existingBusiness.rows.length === 0) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // In a real app, check if user owns this business
      // const business = existingBusiness.rows[0];
      // if (business.owner_id !== req.user.id) {
      //   return res.status(403).json({ error: 'Not authorized to update this business' });
      // }

      const result = await pool.query(`
        UPDATE businesses 
        SET name = COALESCE($1, name), 
            description = COALESCE($2, description), 
            category = COALESCE($3, category), 
            location = COALESCE($4, location),
            contact_number = COALESCE($5, contact_number), 
            whatsapp_link = COALESCE($6, whatsapp_link), 
            instagram_handle = COALESCE($7, instagram_handle), 
            logo_url = COALESCE($8, logo_url), 
            updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `, [name, description, category, location, contact_number, 
           whatsapp_link, instagram_handle, logo_url, id]);

      res.json({
        message: 'Business updated successfully',
        business: result.rows[0]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error updating business' });
    }
  }

  // Delete business (soft delete)
  static async deleteBusiness(req, res) {
    try {
      const { id } = req.params;

      // Check if business exists
      const existingBusiness = await pool.query(
        'SELECT id FROM businesses WHERE id = $1 AND is_active = true',
        [id]
      );
      
      if (existingBusiness.rows.length === 0) {
        return res.status(404).json({ error: 'Business not found' });
      }

      // Soft delete - set is_active to false
      await pool.query(`
        UPDATE businesses 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [id]);

      res.json({ message: 'Business deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error deleting business' });
    }
  }

  // Search businesses
  static async searchBusinesses(req, res) {
    try {
      const { q, category, location, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE b.is_active = true';
      let params = [];
      let paramCount = 0;

      if (q) {
        paramCount++;
        whereClause += ` AND (b.name ILIKE $${paramCount} OR b.description ILIKE $${paramCount})`;
        params.push(`%${q}%`);
      }

      if (category) {
        paramCount++;
        whereClause += ` AND b.category = $${paramCount}`;
        params.push(category);
      }

      if (location) {
        paramCount++;
        whereClause += ` AND b.location = $${paramCount}`;
        params.push(location);
      }

      const query = `
        SELECT b.*, 
               COUNT(DISTINCT p.id) as product_count,
               AVG(r.rating) as average_rating,
               COUNT(r.id) as review_count
        FROM businesses b
        LEFT JOIN products p ON b.id = p.business_id
        LEFT JOIN reviews r ON b.id = r.business_id
        ${whereClause}
        GROUP BY b.id
        ORDER BY 
          CASE WHEN $${paramCount + 1} IS NOT NULL THEN 
            CASE WHEN b.name ILIKE $${paramCount + 1} THEN 1 ELSE 2 END
          ELSE 3 END,
          b.created_at DESC
        LIMIT $${paramCount + 2} OFFSET $${paramCount + 3}
      `;

      params.push(q ? `%${q}%` : null, limit, offset);
      const result = await pool.query(query, params);
      
      res.json({
        businesses: result.rows,
        searchQuery: q,
        filters: { category, location }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error searching businesses' });
    }
  }
}

module.exports = BusinessController;
