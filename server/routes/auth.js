const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Username, email and password are required.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists)
      return res.status(409).json({
        error: exists.username === username
          ? 'Username already taken.'
          : 'Email already registered.',
      });

    const user = await User.create({ username, email, password });
    const token = signToken(user);
    res.status(201).json({ token, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  try {
    // Find by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid username or password.' });

    const token = signToken(user);
    res.json({ token, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    res.json({ username: user.username, email: user.email });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
