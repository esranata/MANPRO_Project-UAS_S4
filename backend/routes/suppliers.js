const express = require('express');
const router = express.Router();
const { readDb, writeDb, addLog } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get Suppliers with Search, Filter & Pagination
router.get('/', verifyToken, (req, res) => {
  const db = readDb();
  let list = [...db.suppliers];

  // Search by Name or Email
  const { search, status, page = 1, limit = 10 } = req.query;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.email.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  }

  // Filter by Status
  if (status && status !== 'All') {
    list = list.filter(s => s.status === status);
  }

  // Pagination
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const paginatedList = list.slice(offset, offset + Number(limit));

  res.json({
    data: paginatedList,
    pagination: {
      totalItems,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit)
    }
  });
});

// Create Supplier (Admin & Staff)
router.post('/', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const { name, address, phone, email, status } = req.body;
  if (!name || !address || !phone || !email || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const newId = db.suppliers.length > 0 ? Math.max(...db.suppliers.map(s => s.id)) + 1 : 1;

  const newSupplier = {
    id: newId,
    name,
    address,
    phone,
    email,
    status
  };

  db.suppliers.push(newSupplier);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menambahkan Supplier Baru: ${name}`);

  res.status(201).json({ message: "Supplier berhasil ditambahkan", supplier: newSupplier });
});

// Update Supplier (Admin & Staff)
router.put('/:id', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const id = Number(req.params.id);
  const { name, address, phone, email, status } = req.body;

  if (!name || !address || !phone || !email || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const index = db.suppliers.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Supplier tidak ditemukan!" });
  }

  db.suppliers[index] = { id, name, address, phone, email, status };
  writeDb(db);

  addLog(req.user.id, req.user.name, `Memperbarui Supplier: ${name}`);

  res.json({ message: "Supplier berhasil diperbarui", supplier: db.suppliers[index] });
});

// Delete Supplier (Admin only)
router.delete('/:id', verifyToken, requireRole(['Admin']), (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const index = db.suppliers.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Supplier tidak ditemukan!" });
  }

  const deletedSupplier = db.suppliers[index];
  db.suppliers.splice(index, 1);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menghapus Supplier: ${deletedSupplier.name}`);

  res.json({ message: "Supplier berhasil dihapus" });
});

module.exports = router;
