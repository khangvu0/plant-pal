import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, verifyDatabaseConnection } from './db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { continueConversation, generateInsights } from './ai.js';
dotenv.config();



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const API = 'https://perenual.com/api/v2';
const KEY = process.env.PERENUAL_KEY;

// Simple in-memory caches to reduce upstream API calls
const SUGGEST_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DETAILS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const suggestCache = new Map(); // key: q (lowercased), value: { v: suggestions[], t: timestamp }
const detailsCache = new Map(); // key: id, value: { v: plant, t: timestamp }

function getFromCache(cache, key, ttl) {
    const hit = cache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.t > ttl) {
        cache.delete(key);
        return null;
    }
    return hit.v;
}

function setCache(cache, key, value) {
    cache.set(key, { v: value, t: Date.now() });
}

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
const SALT_ROUNDS = 10;

async function getUserPlants(userId) {
  const [plants] = await db.execute(
    `SELECT 
      plant_id as id,
      plant_name as name,
      species,
      watering_frequency,
      sunlight,
      notes,
      image_url,
      created_at
    FROM plants
    WHERE user_id = ?`,
    [userId]
  );
  return plants;
}

function buildPlantContext(plants = []) {
  if (!Array.isArray(plants) || plants.length === 0) {
    return null;
  }

  const details = plants
    .map((plant, index) => {
      const name = plant.name || `Plant ${index + 1}`;
      const species = plant.species ? ` (${plant.species})` : '';
      return `• ${name}${species}`;
    })
    .join('\n');

  return `The authenticated user has the following plants:\n${details}\nUse this information to ground your advice, tailoring suggestions to the existing collection.`;
}

// JWT Helper Functions
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
}

// Open AI API
app.post("/api/ai/chat", async (req, res, next) => {
    try {
        const { history = [], prompt } = req.body ?? {};
        if (!prompt) return res.status(400).json({ error: "missing_prompt" });

        let context = null;
        try {
            const token = req.cookies?.authToken;
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded?.userId) {
                    const plants = await getUserPlants(decoded.userId);
                    context = buildPlantContext(plants);
                }
            }
        } catch (contextError) {
            console.warn('AI chat context unavailable:', contextError.message);
        }

        const updatedHistory = await continueConversation(history, prompt, { context });
        res.json({ history: updatedHistory });
    } catch (err) {
        next(err);
    }
});

// Perenual API
app.get('/api/plants/suggest', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();

        if (!KEY) {
            return res.status(500).json({ error: 'Missing PERENUAL_KEY' });
        }

        if (q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const cacheKey = q.toLowerCase();
        const cached = getFromCache(suggestCache, cacheKey, SUGGEST_TTL_MS);
        if (cached) {
            return res.json({ suggestions: cached });
        }

        const response = await fetch(`${API}/species-list?key=${KEY}&q=${encodeURIComponent(q)}&page=1`);
        if (response.status === 429) {
            return res.status(429).json({ error: 'rate_limited' });
        }
        if (!response.ok) {
            throw new Error(`Perenual species-list failed (${response.status})`);
        }

        const json = await response.json();
        const suggestions = (Array.isArray(json.data) ? json.data : [])
            .slice(0, 8)
            .map((item) => ({
                id: item.id,
                common_name: item.common_name || '',
                scientific_name: Array.isArray(item.scientific_name)
                    ? item.scientific_name.join(', ')
                    : item.scientific_name || '',
            }));

        setCache(suggestCache, cacheKey, suggestions);
        res.json({ suggestions });
    } catch (error) {
        console.error('Plant suggest error:', error);
        res.status(500).json({ error: 'Failed to fetch plant suggestions' });
    }
});

app.get('/api/plants/details/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!KEY) {
            return res.status(500).json({ error: 'Missing PERENUAL_KEY' });
        }
        if (!id) {
            return res.status(400).json({ error: 'Missing plant id' });
        }

        const cacheKey = String(id);
        const cached = getFromCache(detailsCache, cacheKey, DETAILS_TTL_MS);
        if (cached) {
            return res.json({ plant: cached });
        }

        const response = await fetch(`${API}/species/details/${id}?key=${KEY}`);
        if (response.status === 404) {
            return res.status(404).json({ error: 'details_not_found' });
        }
        if (response.status === 429) {
            return res.status(429).json({ error: 'rate_limited' });
        }
        if (!response.ok) {
            return res.status(502).json({ error: `upstream_${response.status}` });
        }

        const data = await response.json();
        const scientificName = Array.isArray(data.scientific_name)
            ? data.scientific_name.join(', ')
            : data.scientific_name || '';
        const sunlight = Array.isArray(data.sunlight) ? data.sunlight.join(', ') : data.sunlight || '';
        const watering = data.watering_general_benchmark?.value
            ? `${data.watering_general_benchmark.value} ${data.watering_general_benchmark.unit}`
            : data.watering || '';

        const descriptionSource = data.description ?? null;
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

        const plant = {
            id: data.id ?? Number(id),
            common_name: data.common_name || '',
            scientific_name: scientificName,
            watering_frequency: watering,
            sunlight,
            description,
            image:
                data.default_image?.regular_url ||
                data.default_image?.medium_url ||
                data.default_image?.original_url ||
                null,
        };

        setCache(detailsCache, cacheKey, plant);
        res.json({ plant });
    } catch (error) {
        console.error('Plant details error:', error);
        res.status(500).json({ error: 'Failed to fetch plant details' });
    }
});

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

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Set HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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

// Check authentication status
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ message: 'Logged out successfully', success: true });
});

app.get('/api/ai/insights', authenticateToken, async (req, res) => {
  try {
    const plants = await getUserPlants(req.user.userId);
    if (!Array.isArray(plants) || plants.length === 0) {
      return res.json({
        success: true,
        insights: {
          co2_kg_per_year: 0,
          summary: 'Start your collection to see climate impact insights here.',
          suggested_species: 'Snake plant',
          suggestion_reason: 'Snake plants are hardy starters that thrive in a variety of conditions and help remove indoor pollutants.',
        },
      });
    }

    const insights = await generateInsights(plants);
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Insights generation error:', error);
    const status = error.message === 'OPENAI_API_KEY is missing' ? 503 : 500;
    res.status(status).json({ error: 'Failed to generate insights' });
  }
});

// User Plants API Endpoints
// Get user's plants
app.get('/api/user/plants', authenticateToken, async (req, res) => {
  try {
    const [plants] = await db.execute(
      `SELECT 
        plant_id as id,
        plant_name as name,
        species,
        watering_frequency,
        sunlight,
        notes,
        image_url,
        created_at
      FROM plants
      WHERE user_id = ?`,
      [req.user.userId]
    );

    res.json({
      success: true,
      plants: plants
    });
  } catch (error) {
    console.error('Get plants error:', error);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

// Add a plant to user's collection
app.post('/api/user/plants', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      species,
      watering_frequency,
      sunlight,
      notes,
      image_url
    } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return res.status(400).json({ error: 'Plant name is required' });
    }

    const trimmedSpecies = typeof species === 'string' ? species.trim() : '';
    const normalizeOptional = (value) => {
      if (typeof value === 'string') {
        const cleaned = value.trim();
        return cleaned.length > 0 ? cleaned : null;
      }
      return value ?? null;
    };

    const normalizedPlant = {
      name: trimmedName,
      species: trimmedSpecies,
      watering_frequency: normalizeOptional(watering_frequency),
      sunlight: normalizeOptional(sunlight),
      notes: normalizeOptional(notes),
      image_url: normalizeOptional(image_url)
    };

    const [result] = await db.execute(
      `INSERT INTO plants (
        user_id,
        plant_name,
        species,
        watering_frequency,
        sunlight,
        notes,
        image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        normalizedPlant.name,
        normalizedPlant.species,
        normalizedPlant.watering_frequency,
        normalizedPlant.sunlight,
        normalizedPlant.notes,
        normalizedPlant.image_url
      ]
    );

    const [rows] = await db.execute(
      `SELECT 
        plant_id as id,
        plant_name as name,
        species,
        watering_frequency,
        sunlight,
        notes,
        image_url,
        created_at
      FROM plants
      WHERE plant_id = ? AND user_id = ?`,
      [result.insertId, req.user.userId]
    );

    const inserted = rows?.[0];
    if (!inserted) {
      return res.status(500).json({ error: 'Failed to load inserted plant' });
    }

    res.status(201).json({
      success: true,
      message: 'Plant added successfully',
      plant: inserted
    });
  } catch (error) {
    console.error('Add plant error:', error);
    res.status(500).json({ error: 'Failed to add plant' });
  }
});

// Update a plant
app.put('/api/user/plants/:id', authenticateToken, async (req, res) => {
  try {
    const plantId = req.params.id;
    const { name, species, watering_frequency, sunlight, notes, image_url } = req.body;

    // Verify plant belongs to user & fetch current values
    const [existing] = await db.execute(
      `SELECT 
        plant_name,
        species,
        watering_frequency,
        sunlight,
        notes,
        image_url
      FROM plants
      WHERE plant_id = ? AND user_id = ?`,
      [plantId, req.user.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Plant not found or not owned by user' });
    }

    const current = existing[0];
    const normalizeOptional = (value, fallback) => {
      if (typeof value === 'string') {
        const cleaned = value.trim();
        return cleaned.length > 0 ? cleaned : null;
      }
      return value ?? fallback ?? null;
    };

    const nextValues = {
      name:
        typeof name === 'string' && name.trim().length > 0
          ? name.trim()
          : current.plant_name,
      species:
        typeof species === 'string'
          ? species.trim()
          : (current.species ?? ''),
      watering_frequency: normalizeOptional(
        watering_frequency,
        current.watering_frequency
      ),
      sunlight: normalizeOptional(sunlight, current.sunlight),
      notes: normalizeOptional(notes, current.notes),
      image_url: normalizeOptional(image_url, current.image_url)
    };

    await db.execute(
      `UPDATE plants
        SET plant_name = ?,
            species = ?,
            watering_frequency = ?,
            sunlight = ?,
            notes = ?,
            image_url = ?
      WHERE plant_id = ? AND user_id = ?`,
      [
        nextValues.name,
        nextValues.species,
        nextValues.watering_frequency,
        nextValues.sunlight,
        nextValues.notes,
        nextValues.image_url,
        plantId,
        req.user.userId
      ]
    );

    const [rows] = await db.execute(
      `SELECT 
        plant_id as id,
        plant_name as name,
        species,
        watering_frequency,
        sunlight,
        notes,
        image_url,
        created_at
      FROM plants
      WHERE plant_id = ? AND user_id = ?`,
      [plantId, req.user.userId]
    );

    const updated = rows?.[0];

    res.json({
      success: true,
      message: 'Plant updated successfully',
      plant: updated
    });
  } catch (error) {
    console.error('Update plant error:', error);
    res.status(500).json({ error: 'Failed to update plant' });
  }
});

// Delete a plant
app.delete('/api/user/plants/:id', authenticateToken, async (req, res) => {
  try {
    const plantId = req.params.id;

    // Verify plant belongs to user and delete
    const [result] = await db.execute(
      'DELETE FROM plants WHERE plant_id = ? AND user_id = ?',
      [plantId, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plant not found or not owned by user' });
    }

    res.json({
      success: true,
      message: 'Plant deleted successfully'
    });
  } catch (error) {
    console.error('Delete plant error:', error);
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await verifyDatabaseConnection();
});
