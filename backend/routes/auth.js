const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { readDb, writeDb, addLog } = require('../db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi!" });
  }

  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: "Email atau password salah!" });
  }

  if (user.status !== 'Active') {
    return res.status(403).json({ message: "Akun Anda dinonaktifkan. Silakan hubungi admin." });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Email atau password salah!" });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  addLog(user.id, user.name, `User ${user.role} berhasil login`);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

// Get profile of current user
router.get('/me', verifyToken, (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan!" });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  });
});

// Update Profile details
router.put('/update-profile', verifyToken, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Nama dan Email wajib diisi!" });
  }

  const db = readDb();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User tidak ditemukan!" });
  }

  // Check email conflict
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== req.user.id);
  if (emailExists) {
    return res.status(400).json({ message: "Email sudah digunakan oleh user lain!" });
  }

  db.users[userIndex].name = name;
  db.users[userIndex].email = email;
  writeDb(db);

  addLog(req.user.id, name, "Memperbarui data profil");

  res.json({
    message: "Profil berhasil diperbarui",
    user: {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      role: db.users[userIndex].role,
      status: db.users[userIndex].status
    }
  });
});

// Change Password
router.put('/change-password', verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Password lama dan baru wajib diisi!" });
  }

  const db = readDb();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: "User tidak ditemukan!" });
  }

  const isPasswordValid = bcrypt.compareSync(oldPassword, db.users[userIndex].password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Password lama salah!" });
  }

  db.users[userIndex].password = bcrypt.hashSync(newPassword, 8);
  writeDb(db);

  addLog(req.user.id, req.user.name, "Mengubah password akun");

  res.json({ message: "Password berhasil diubah!" });
});

module.exports = router;
