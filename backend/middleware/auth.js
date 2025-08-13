// Authentication middleware for KNUST Enterprise Hub
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    // Get token from Authorization header or cookies
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    const cookieToken = req.cookies?.token;
    
    const token = headerToken || cookieToken;
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied. No authentication token provided.',
            requiresAuth: true 
        });
    }
    
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token has expired. Please log in again.',
                requiresAuth: true 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token. Please log in again.',
                requiresAuth: true 
            });
        }
        
        return res.status(401).json({ 
            error: 'Authentication failed.',
            requiresAuth: true 
        });
    }
};

// Middleware to verify user owns the resource
const authorizeOwner = (resourceType) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            const userId = req.user.id;
            
            // Import pool here to avoid circular dependency
            const { Pool } = require('pg');
            const pool = new Pool(config.database);
            
            let query;
            let params;
            
            switch (resourceType) {
                case 'business':
                    query = 'SELECT owner_id FROM businesses WHERE id = $1';
                    params = [resourceId];
                    break;
                case 'product':
                    query = `
                        SELECT b.owner_id 
                        FROM products p 
                        JOIN businesses b ON p.business_id = b.id 
                        WHERE p.id = $1
                    `;
                    params = [resourceId];
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid resource type' });
            }
            
            const result = await pool.query(query, params);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: `${resourceType} not found` });
            }
            
            const ownerId = result.rows[0].owner_id;
            
            if (ownerId !== userId) {
                return res.status(403).json({ 
                    error: `You don't have permission to modify this ${resourceType}` 
                });
            }
            
            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

// Middleware for optional authentication (user info if logged in, but not required)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies?.token;
    
    const token = headerToken || cookieToken;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = decoded;
        } catch (error) {
            // Token invalid, but that's okay for optional auth
            req.user = null;
        }
    } else {
        req.user = null;
    }
    
    next();
};

// Middleware to check if user is admin (for future features)
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ 
            error: 'Admin access required' 
        });
    }
    next();
};

// Generate JWT token
const generateToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin || false
    };
    
    return jwt.sign(payload, config.jwt.secret, { 
        expiresIn: '7d' // Token expires in 7 days
    });
};

// Verify token without middleware (for utility use)
const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        return null;
    }
};

// Get user info from token
const getUserFromToken = (token) => {
    const decoded = verifyToken(token);
    return decoded ? {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        isAdmin: decoded.isAdmin
    } : null;
};

module.exports = {
    authenticateToken,
    authorizeOwner,
    optionalAuth,
    requireAdmin,
    generateToken,
    verifyToken,
    getUserFromToken
};
