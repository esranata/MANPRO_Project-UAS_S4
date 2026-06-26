const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readDb, writeDb, addLog } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Require Admin role for all user management endpoints
router.use(verifyToken, requireRole(['Admin']));

// Get all users
router.get('/', (req, res) => {
  const db = readDb();
  // Map users to remove password hash
  const usersList = db.users.map(({ password, ...u }) => u);
  res.json(usersList);
});

// Create User
router.post('/', (req, res) => {
  const { name, email, role, password } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());

  if (emailExists) {
    return res.status(400).json({ message: "Email sudah terdaftar!" });
  }

  const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  const newUser = {
    id: newId,
    name,
    email: email.toLowerCase(),
    password: bcrypt.hashSync(password, 8),
    role,
    status: 'Active'
  };

  db.users.push(newUser);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Membuat user baru: ${name} (${role})`);

  const { password: _, ...userWithoutPass } = newUser;
  res.status(201).json({ message: "User berhasil dibuat", user: userWithoutPass });
});

// Update User details
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const { name, email, role, status } = req.body;

  if (!name || !email || !role || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const index = db.users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "User tidak ditemukan!" });
  }

  // Prevent admin from disabling their own account
  if (id === req.user.id && status !== 'Active') {
    return res.status(400).json({ message: "Anda tidak dapat menonaktifkan akun sendiri!" });
  }

  // Check email conflict
  const emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);
  if (emailExists) {
    return res.status(400).json({ message: "Email sudah digunakan oleh user lain!" });
  }

  db.users[index].name = name;
  db.users[index].email = email.toLowerCase();
  db.users[index].role = role;
  db.users[index].status = status;

  writeDb(db);
  addLog(req.user.id, req.user.name, `Memperbarui user: ${name}`);

  const { password: _, ...updatedUser } = db.users[index];
  res.json({ message: "User berhasil diperbarui", user: updatedUser });
});

// Reset Password
router.post('/:id/reset-password', (req, res) => {
  const id = Number(req.params.id);
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "Password baru wajib diisi!" });
  }

  const db = readDb();
  const index = db.users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "User tidak ditemukan!" });
  }

  db.users[index].password = bcrypt.hashSync(newPassword, 8);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Mereset password user: ${db.users[index].name}`);

  res.json({ message: `Password untuk ${db.users[index].name} berhasil di-reset!` });
});

// Toggle Status (Nonaktifkan / Aktifkan)
router.post('/:id/toggle-status', (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const index = db.users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "User tidak ditemukan!" });
  }

  if (id === req.user.id) {
    return res.status(400).json({ message: "Anda tidak dapat menonaktifkan akun sendiri!" });
  }

  const user = db.users[index];
  user.status = user.status === 'Active' ? 'Inactive' : 'Active';

  db.users[index] = user;
  writeDb(db);

  const statusMessage = user.status === 'Active' ? 'diaktifkan' : 'dinonaktifkan';
  addLog(req.user.id, req.user.name, `Mengubah status user ${user.name} menjadi ${user.status}`);

  res.json({ message: `User berhasil ${statusMessage}!`, status: user.status });
});

module.exports = router;
