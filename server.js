const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const { User } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, 'Nestrox Frontend');
const BRAND_DIR    = path.join(__dirname, 'Nestrox Logo & Brand');

/* ============================================================
   Middleware
   ============================================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: 'nestrox-secret-key-129-purple-blue-navy',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: false
  }
}));

// Serve static frontend files (index.html, dashboard.html, CSS, JS)
app.use(express.static(FRONTEND_DIR));

// Bulletproof middleware for Logo & Brand assets
// (Avoids URL encoding issues with spaces and '&' in the folder name)
app.use((req, res, next) => {
  if (req.path.includes('Background.png')) {
    return res.sendFile(path.join(BRAND_DIR, 'Background.png'));
  }
  if (req.path.includes('Nestrox_Logo_No_Bg.png')) {
    return res.sendFile(path.join(BRAND_DIR, 'Nestrox_Logo_No_Bg.png'));
  }
  if (req.path.includes('Nestrox_BrandName.png')) {
    return res.sendFile(path.join(BRAND_DIR, 'Nestrox_BrandName.png'));
  }
  if (req.path.includes('Nestrox_Brand_No_Bg.png')) {
    return res.sendFile(path.join(BRAND_DIR, 'Nestrox_Brand_No_Bg.png'));
  }
  if (req.path.includes('Nestrox_Logo.png')) {
    return res.sendFile(path.join(BRAND_DIR, 'Nestrox_Logo.png'));
  }
  next();
});

/* ============================================================
   Auth Guard Middleware
   ============================================================ */
const checkAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please log in first.' });
  }
};

/* ============================================================
   API ENDPOINTS
   ============================================================ */

/**
 * POST /api/register
 * Register a new user. Validates required fields, checks for
 * duplicate username/email/phone, hashes password with bcrypt,
 * and inserts into the MongoDB database.
 */
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, username, email, phone, password } = req.body;

    // --- Required field check ---
    if (!fullName || !fullName.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required.' });
    if (!email    || !email.trim())    return res.status(400).json({ error: 'Email is required.' });
    if (!phone    || !phone.trim())    return res.status(400).json({ error: 'Phone number is required.' });
    if (!password)                     return res.status(400).json({ error: 'Password is required.' });

    // --- Duplicate checks using Mongoose ---
    const existingUsername = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(400).json({ error: 'Phone number already registered.' });
    }

    // --- Hash password with bcrypt ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Insert new user ---
    const userId      = crypto.randomUUID();
    const createdDate = new Date().toISOString();

    const newUser = new User({
      id: userId,
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      created_date: createdDate
    });

    await newUser.save();

    return res.status(201).json({ success: true, message: 'Registration successful!' });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/login
 * Authenticate using username OR email + password.
 * Creates a server-side session on success.
 */
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Username or email is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const idenLower = identifier.trim().toLowerCase();

    // Find user by username OR email
    const user = await User.findOne({
      $or: [
        { username: idenLower },
        { email: idenLower }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Create session
    req.session.userId   = user.id;
    req.session.username = user.username;

    return res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id:       user.id,
        fullName: user.full_name,
        username: user.username,
        email:    user.email,
        phone:    user.phone
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * GET /api/user
 * Returns the currently logged-in user's profile.
 * Requires an active session (auth guarded).
 */
app.get('/api/user', checkAuth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.session.userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      success: true,
      user: {
        id:          user.id,
        fullName:    user.full_name,
        username:    user.username,
        email:       user.email,
        phone:       user.phone,
        createdDate: user.created_date
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: 'Failed to retrieve user details.' });
  }
});

/**
 * PUT /api/user
 * Update the logged-in user's profile (fullName, email, phone).
 * Stubbed for future use — auth guarded.
 */
app.put('/api/user', checkAuth, async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;

    if (!fullName && !email && !phone) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    // Duplicate email check (excluding current user)
    if (email) {
      const existing = await User.findOne({ email: email.trim().toLowerCase(), id: { $ne: req.session.userId } });
      if (existing) return res.status(400).json({ error: 'Email already registered.' });
    }

    // Duplicate phone check (excluding current user)
    if (phone) {
      const existing = await User.findOne({ phone: phone.trim(), id: { $ne: req.session.userId } });
      if (existing) return res.status(400).json({ error: 'Phone number already registered.' });
    }

    // Build update object
    const updateData = {};
    if (fullName) updateData.full_name = fullName.trim();
    if (email)    updateData.email     = email.trim().toLowerCase();
    if (phone)    updateData.phone     = phone.trim();

    await User.updateOne({ id: req.session.userId }, { $set: updateData });

    return res.json({ success: true, message: 'Profile updated successfully.' });

  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Profile update failed.' });
  }
});

/**
 * POST /api/logout
 * Destroys the server-side session and clears the cookie.
 */
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
});

/* ============================================================
   Static File Fallback
   Serve the correct HTML file for known pages,
   and index.html for everything else.
   ============================================================ */
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'dashboard.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

/* ============================================================
   Start Server
   ============================================================ */
app.listen(PORT, () => {
  console.log(`\n✅  Nestrox server running at http://localhost:${PORT}`);
  console.log(`    Open this URL in your browser to use the app.\n`);
});
