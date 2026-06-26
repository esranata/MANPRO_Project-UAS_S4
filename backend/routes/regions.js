const express = require('express');
const router = express.Router();
const { readDb, writeDb, addLog } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get all regions (joins and calculates distributorCount)
router.get('/', verifyToken, (req, res) => {
  const db = readDb();
  const regions = db.regions || [];
  const distributors = db.distributors || [];

  const list = regions.map(r => {
    const matchingDists = distributors.filter(d => d.regionId.toUpperCase() === r.id.toUpperCase());
    return {
      ...r,
      distributorCount: matchingDists.length
    };
  });

  res.json(list);
});

// Create Region (Admin & Staff)
router.post('/', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const { id, name } = req.body;

  if (!id || !name) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const exists = db.regions.some(r => r.id.toUpperCase() === id.toUpperCase());
  if (exists) {
    return res.status(400).json({ message: `Kode Wilayah '${id}' sudah terpakai!` });
  }

  const newRegion = {
    id: id.toUpperCase(),
    name
  };

  db.regions.push(newRegion);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menambahkan Wilayah Baru: ${name} (${newRegion.id})`);

  res.status(201).json({ message: "Wilayah berhasil ditambahkan", region: newRegion });
});

// Update Region (Admin & Staff)
router.put('/:id', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Nama wilayah wajib diisi!" });
  }

  const db = readDb();
  const index = db.regions.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ message: "Wilayah tidak ditemukan!" });
  }

  db.regions[index].name = name;
  writeDb(db);

  addLog(req.user.id, req.user.name, `Memperbarui Wilayah: ${name} (${id})`);

  res.json({ message: "Wilayah berhasil diperbarui", region: db.regions[index] });
});

// Delete Region (Admin only)
router.delete('/:id', verifyToken, requireRole(['Admin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.regions.findIndex(r => r.id.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ message: "Wilayah tidak ditemukan!" });
  }

  // Prevent delete if distributors exist in this region
  const hasDistributors = db.distributors.some(d => d.regionId.toUpperCase() === id.toUpperCase());
  if (hasDistributors) {
    return res.status(400).json({ message: "Tidak dapat menghapus wilayah karena memiliki distributor terdaftar!" });
  }

  const deletedReg = db.regions[index];
  db.regions.splice(index, 1);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menghapus Wilayah: ${deletedReg.name} (${id})`);

  res.json({ message: "Wilayah berhasil dihapus" });
});

module.exports = router;
