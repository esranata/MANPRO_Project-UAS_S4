const express = require('express');
const router = express.Router();
const { readDb, writeDb, addLog } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get all warehouses
router.get('/', verifyToken, (req, res) => {
  const db = readDb();
  let list = [...db.warehouses];

  const { search } = req.query;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(w => 
      w.id.toLowerCase().includes(q) || 
      w.name.toLowerCase().includes(q) || 
      w.location.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

// Get detailed warehouse with its inventory list
router.get('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const warehouse = db.warehouses.find(w => w.id.toUpperCase() === id.toUpperCase());
  if (!warehouse) {
    return res.status(404).json({ message: "Gudang tidak ditemukan!" });
  }

  // Find all goods registered to this warehouse
  const goods = db.goods.filter(g => g.warehouseId.toUpperCase() === id.toUpperCase());

  res.json({
    ...warehouse,
    inventory: goods
  });
});

// Create Warehouse (Admin & Staff)
router.post('/', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const { id, name, location, capacity, status } = req.body;

  if (!id || !name || !location || !capacity || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const exists = db.warehouses.some(w => w.id.toUpperCase() === id.toUpperCase());
  if (exists) {
    return res.status(400).json({ message: `Kode Gudang '${id}' sudah digunakan!` });
  }

  const newWarehouse = {
    id: id.toUpperCase(),
    name,
    location,
    capacity: Number(capacity),
    status
  };

  db.warehouses.push(newWarehouse);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menambahkan Gudang Baru: ${name} (${newWarehouse.id})`);

  res.status(201).json({ message: "Gudang berhasil ditambahkan", warehouse: newWarehouse });
});

// Update Warehouse (Admin & Staff)
router.put('/:id', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const { id } = req.params;
  const { name, location, capacity, status } = req.body;

  if (!name || !location || !capacity || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const index = db.warehouses.findIndex(w => w.id.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ message: "Gudang tidak ditemukan!" });
  }

  db.warehouses[index] = {
    id: id.toUpperCase(),
    name,
    location,
    capacity: Number(capacity),
    status
  };
  writeDb(db);

  addLog(req.user.id, req.user.name, `Memperbarui Gudang: ${name} (${id})`);

  res.json({ message: "Gudang berhasil diperbarui", warehouse: db.warehouses[index] });
});

// Delete Warehouse (Admin only)
router.delete('/:id', verifyToken, requireRole(['Admin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.warehouses.findIndex(w => w.id.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ message: "Gudang tidak ditemukan!" });
  }

  // Prevent deletion if items are in this warehouse
  const hasInventory = db.goods.some(g => g.warehouseId.toUpperCase() === id.toUpperCase());
  if (hasInventory) {
    return res.status(400).json({ message: "Tidak dapat menghapus gudang karena masih berisi data barang!" });
  }

  const deletedWarehouse = db.warehouses[index];
  db.warehouses.splice(index, 1);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menghapus Gudang: ${deletedWarehouse.name} (${id})`);

  res.json({ message: "Gudang berhasil dihapus" });
});

module.exports = router;
