import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, verifyDatabaseConnection } from './db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { continueConversation } from './ai.js';
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API = 'https://perenual.com/api/v2';
const KEY = process.env.PERENUAL_KEY;

const app = express();
app.use(cors());
app.use(express.json());
const SALT_ROUNDS = 10;

// Open AI API
app.post("/api/ai/chat", async (req, res, next) => {
    try {
        const { history = [], prompt } = req.body ?? {};
        if (!prompt) return res.status(400).json({ error: "missing_prompt" });

        const updatedHistory = await continueConversation(history, prompt);
        res.json({ history: updatedHistory });
    } catch (err) {
        next(err);
    }
});

// Perenual API
app.get('/api/plants', async (req, res) => {
try {
    const q = (req.query.q || '').trim();
    const page = req.query.page || 1;

    if (!KEY) {
        return res.status(500).json({ error: 'Missing PERENUAL_KEY' });
    }
    if (!q) {
        return res.status(400).json({ error: 'Missing plant query' });
    }

    // Information from plant API
    const listResp = await fetch(`${API}/species-list?key=${KEY}&q=${encodeURIComponent(q)}&page=${page}`);
    if (!listResp.ok) {
        throw new Error(`Perenual species-list failed (${listResp.status})`);
    }
    const listJson = await listResp.json();
    const rows = Array.isArray(listJson.data) ? listJson.data : [];

    if (rows.length === 0) {
        return res.status(404).json({ error: 'No species found' });
    }

    // Specific details (information regarding plant care)
    const detailPromises = rows.map(r =>
        fetch(`${API}/species/details/${r.id}?key=${KEY}`)
            .then((rsp) => (rsp.ok ? rsp.json() : null))
            .catch(() => null)
    );
    const details = await Promise.all(detailPromises);

    // Getting necessary details to frontend
    const data = rows.map((r, i) => {
        const d = details[i] || {};
        const sci = Array.isArray(r.scientific_name)
            ? r.scientific_name.join(', ')
            : Array.isArray(d.scientific_name)
            ? d.scientific_name.join(', ')
            : '';
        const sunlight = Array.isArray(d.sunlight) ? d.sunlight.join(', ') : '';
        const waterFreq = d.watering_general_benchmark?.value
            ? `${d.watering_general_benchmark.value} ${d.watering_general_benchmark.unit}`
            : d.watering || '';
        const img =
            r.default_image?.medium_url ||
            r.default_image?.regular_url ||
            r.default_image?.original_url ||
            null;

        const descriptionSource = d.description ?? r.description ?? null;
        let description = '';
        if (typeof descriptionSource === 'string') {
            description = descriptionSource;
        } else if (Array.isArray(descriptionSource)) {
            description = descriptionSource.filter((part) => typeof part === 'string').join(' ');
        } else if (
            descriptionSource &&
            typeof descriptionSource === 'object' &&
            !Array.isArray(descriptionSource)
        ) {
            description = Object.values(descriptionSource)
                .flat()
                .filter((part) => typeof part === 'string')
                .join(' ');
        }

        return {
            id: r.id,
            common_name: r.common_name || '',
            scientific_name: sci,
            watering_frequency: waterFreq,
            sunlight,
            image: img,
            description,
        };
    });

    res.json({ data, page: Number(page) });
    } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plants' });
}
});

// Serve static files from client/dist
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/api/register', (req, res) => {
    res.json({message: "Register endpoint is working"});
});

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
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'User already exists with this email' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password_hash, SALT_ROUNDS);

        // Insert new user
        const [result] = await db.execute(
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

app.get('/api/login', (req, res) => {
    res.json({message: "Login endpoint is working"});
});

// Login user route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await db.execute(
      'SELECT id, email, password_hash, first_name, last_name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    res.json({
      message: 'Login successful!',
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please check your credentials.' });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await verifyDatabaseConnection();
});
