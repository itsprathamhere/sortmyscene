const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Required fields
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    // Name validation
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2 || trimmedName.length > 50)
      return res.status(400).json({ message: 'Name must be between 2 and 50 characters.' });

    // Email validation
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail))
      return res.status(400).json({ message: 'Please enter a valid email address.' });

    // Password validation
    if (typeof password !== 'string' || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (password.length > 128)
      return res.status(400).json({ message: 'Password must not exceed 128 characters.' });

    // Check duplicate
    const exists = await User.findOne({ email: trimmedEmail });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });

    const user  = await User.create({ name: trimmedName, email: trimmedEmail, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail))
      return res.status(400).json({ message: 'Please enter a valid email address.' });

    if (typeof password !== 'string' || password.length < 1)
      return res.status(400).json({ message: 'Password is required.' });

    const user = await User.findOne({ email: trimmedEmail });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password.' });

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
