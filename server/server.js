import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, verifyDatabaseConnection } from './db.js';
const axios = require('axios');
const { pool } = require('pg');
require('dotenv').config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

// Register new user route
app.post('/api/register', async (req, res) => {
    try {
        const {email, password_hash, first_name, last_name} = req.body;
    
        // Validate input
        if (!email || !password_hash || !first_name || !last_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Check password length
        if (password_hash.length < 6 || password_hash.length > 30) {
            return res.status(400).json({ error: 'Password must be between 6 and 30 characters' });
        }
        // Check if the user already exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing > 0) {
        return res.status(409).json({ error: 'User already exists with this email' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password_hash, 10);

    // Insert new user
    const [result] = await pool.execute(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
        [email, passwordHash, first_name, last_name]
    );
    
        res.status(201).json({ 
            message: 'User registered successfully',
            success: true,
            user: {
                id: result.insertId,
                email,
                first_name,
                last_name
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

    const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
    app.listen(PORT, async () => {
        console.log(`Server running on http://localhost:${PORT}`);
        await verifyDatabaseConnection();
    });
