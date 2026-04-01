const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/env');
const { AppError } = require('../middleware/error.middleware');

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  return { accessToken, refreshToken };
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userRole = role === 'provider' ? 'provider' : 'customer';

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone || null, userRole]
    );

    const userId = result.insertId;

    // If provider, create empty profile
    if (userRole === 'provider') {
      await db.query('INSERT INTO provider_profiles (user_id) VALUES (?)', [userId]);
    }

    const tokens = generateTokens({ id: userId, role: userRole });
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, userId]);

    res.status(201).json({
      message: 'Registration successful',
      user: { id: userId, name, email, role: userRole },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = generateTokens(user);
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
      },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [decoded.id, refreshToken]);
    if (rows.length === 0) {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = rows[0];
    const tokens = generateTokens(user);
    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

    res.json(tokens);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.is_verified, u.created_at,
              pp.bio, pp.skills, pp.years_experience, pp.id_verified, pp.avg_rating,
              pp.total_jobs_done, pp.service_radius_km, pp.location_lat, pp.location_lng, pp.location_address
       FROM users u
       LEFT JOIN provider_profiles pp ON u.id = pp.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, skills, years_experience, service_radius_km, location_lat, location_lng, location_address } = req.body;

    await db.query('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?',
      [name, phone, req.user.id]
    );

    if (req.user.role === 'provider') {
      await db.query(
        `UPDATE provider_profiles SET
          bio = COALESCE(?, bio),
          skills = COALESCE(?, skills),
          years_experience = COALESCE(?, years_experience),
          service_radius_km = COALESCE(?, service_radius_km),
          location_lat = COALESCE(?, location_lat),
          location_lng = COALESCE(?, location_lng),
          location_address = COALESCE(?, location_address)
        WHERE user_id = ?`,
        [bio, skills ? JSON.stringify(skills) : null, years_experience, service_radius_km, location_lat, location_lng, location_address, req.user.id]
      );
    }

    res.json({ message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    next(err);
  }
};
