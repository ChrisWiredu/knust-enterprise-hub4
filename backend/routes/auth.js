// Authentication routes for KNUST Enterprise Hub
const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { config } = require('../config/env');
const { generateToken, authenticateToken, getUserFromToken } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool(config.database);

// Input validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    // At least 6 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    return passwordRegex.test(password);
};

const validateKNUSTEmail = (email) => {
    // KNUST email format: something@st.knust.edu.gh or something@knust.edu.gh
    const knustEmailRegex = /^[a-zA-Z0-9._%+-]+@(st\.)?knust\.edu\.gh$/;
    return knustEmailRegex.test(email);
};

const validateIndexNumber = (indexNumber) => {
    // KNUST index number format: typically 8-10 digits
    const indexRegex = /^[0-9]{8,10}$/;
    return indexRegex.test(indexNumber);
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            confirmPassword,
            firstName,
            lastName,
            indexNumber,
            hallOfResidence,
            department,
            phoneNumber
        } = req.body;

        // Input validation
        const errors = [];

        if (!username || username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!email || !validateEmail(email)) {
            errors.push('Please provide a valid email address');
        }

        if (!validateKNUSTEmail(email)) {
            errors.push('Please use your KNUST email address (@knust.edu.gh or @st.knust.edu.gh)');
        }

        if (!password || !validatePassword(password)) {
            errors.push('Password must be at least 6 characters long and contain at least one letter and one number');
        }

        if (password !== confirmPassword) {
            errors.push('Password confirmation does not match');
        }

        if (!firstName || firstName.length < 2) {
            errors.push('First name must be at least 2 characters long');
        }

        if (!lastName || lastName.length < 2) {
            errors.push('Last name must be at least 2 characters long');
        }

        if (!indexNumber || !validateIndexNumber(indexNumber)) {
            errors.push('Please provide a valid KNUST index number (8-10 digits)');
        }

        if (!hallOfResidence) {
            errors.push('Hall of residence is required');
        }

        if (!department) {
            errors.push('Department is required');
        }

        if (!phoneNumber || phoneNumber.length < 9) {
            errors.push('Please provide a valid phone number');
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors 
            });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2 OR index_number = $3',
            [username, email, indexNumber]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ 
                error: 'User already exists with this username, email, or index number' 
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await pool.query(`
            INSERT INTO users (
                username, email, password_hash, first_name, last_name,
                index_number, hall_of_residence, department, phone_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, username, email, first_name, last_name, index_number,
                      hall_of_residence, department, phone_number, created_at
        `, [
            username, email, hashedPassword, firstName, lastName,
            indexNumber, hallOfResidence, department, phoneNumber
        ]);

        const user = result.rows[0];

        // Generate JWT token
        const token = generateToken(user);

        // Set secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            message: 'Registration successful! Welcome to KNUST Enterprise Hub!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                indexNumber: user.index_number,
                hallOfResidence: user.hall_of_residence,
                department: user.department,
                phoneNumber: user.phone_number
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Registration failed. Please try again.' 
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Username and password are required' 
            });
        }

        // Find user by username or email
        const result = await pool.query(`
            SELECT id, username, email, password_hash, first_name, last_name,
                   index_number, hall_of_residence, department, phone_number,
                   is_verified
            FROM users 
            WHERE username = $1 OR email = $1
        `, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Invalid username or password' 
            });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid username or password' 
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Set secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Update last login (optional)
        await pool.query(
            'UPDATE users SET updated_at = NOW() WHERE id = $1',
            [user.id]
        );

        res.json({
            message: 'Login successful!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                indexNumber: user.index_number,
                hallOfResidence: user.hall_of_residence,
                department: user.department,
                phoneNumber: user.phone_number,
                isVerified: user.is_verified
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed. Please try again.' 
        });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, username, email, first_name, last_name,
                   index_number, hall_of_residence, department, phone_number,
                   is_verified, profile_picture_url, created_at
            FROM users 
            WHERE id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                indexNumber: user.index_number,
                hallOfResidence: user.hall_of_residence,
                department: user.department,
                phoneNumber: user.phone_number,
                isVerified: user.is_verified,
                profilePictureUrl: user.profile_picture_url,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user information' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            hallOfResidence,
            department,
            phoneNumber,
            profilePictureUrl
        } = req.body;

        const result = await pool.query(`
            UPDATE users 
            SET first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                hall_of_residence = COALESCE($3, hall_of_residence),
                department = COALESCE($4, department),
                phone_number = COALESCE($5, phone_number),
                profile_picture_url = COALESCE($6, profile_picture_url),
                updated_at = NOW()
            WHERE id = $7
            RETURNING id, username, email, first_name, last_name,
                      hall_of_residence, department, phone_number, profile_picture_url
        `, [firstName, lastName, hallOfResidence, department, phoneNumber, profilePictureUrl, req.user.id]);

        const user = result.rows[0];

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                hallOfResidence: user.hall_of_residence,
                department: user.department,
                phoneNumber: user.phone_number,
                profilePictureUrl: user.profile_picture_url
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                error: 'All password fields are required' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                error: 'New password confirmation does not match' 
            });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                error: 'New password must be at least 6 characters long and contain at least one letter and one number' 
            });
        }

        // Get current password hash
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Verify token endpoint (for frontend to check if user is still logged in)
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies?.token;
    
    const token = headerToken || cookieToken;
    
    if (!token) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }
    
    const user = getUserFromToken(token);
    
    if (!user) {
        return res.status(401).json({ valid: false, message: 'Invalid token' });
    }
    
    res.json({ valid: true, user });
});

module.exports = router;
