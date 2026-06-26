const express = require('express');
const router = express.Router();
const { readDb } = require('../db');
const { verifyToken } = require('../middleware/auth');

// Get all activity logs (Newest first)
router.get('/', verifyToken, (req, res) => {
  const db = readDb();
  res.json(db.logs || []);
});

module.exports = router;
