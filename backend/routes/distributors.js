const express = require('express');
const router = express.Router();
const { readDb, writeDb, addLog } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get all distributors
router.get('/', verifyToken, (req, res) => {
  const db = readDb();
  const regions = db.regions || [];

  // Map region name
  let list = db.distributors.map(d => {
    const reg = regions.find(r => r.id.toUpperCase() === d.regionId.toUpperCase());
    return {
      ...d,
      regionName: reg ? reg.name : 'Wilayah Tidak Diketahui'
    };
  });

  const { search } = req.query;
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(d => 
      d.id.toLowerCase().includes(q) || 
      d.name.toLowerCase().includes(q) || 
      d.phone.toLowerCase().includes(q) ||
      d.regionName.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

// Create Distributor (Admin & Staff)
router.post('/', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const { id, name, regionId, phone, status } = req.body;

  if (!id || !name || !regionId || !phone || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();

  // Validate Region exists
  const regionExists = db.regions.some(r => r.id.toUpperCase() === regionId.toUpperCase());
  if (!regionExists) {
    return res.status(404).json({ message: "Kode Wilayah tidak ditemukan!" });
  }

  // Check unique ID
  const exists = db.distributors.some(d => d.id.toUpperCase() === id.toUpperCase());
  if (exists) {
    return res.status(400).json({ message: `Kode Distributor '${id}' sudah terpakai!` });
  }

  const newDistributor = {
    id: id.toUpperCase(),
    name,
    regionId: regionId.toUpperCase(),
    phone,
    status
  };

  db.distributors.push(newDistributor);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menambahkan Distributor Baru: ${name} (${newDistributor.id})`);

  res.status(201).json({ message: "Distributor berhasil ditambahkan", distributor: newDistributor });
});

// Update Distributor (Admin & Staff)
router.put('/:id', verifyToken, requireRole(['Admin', 'Staff']), (req, res) => {
  const { id } = req.params;
  const { name, regionId, phone, status } = req.body;

  if (!name || !regionId || !phone || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const index = db.distributors.findIndex(d => d.id.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ message: "Distributor tidak ditemukan!" });
  }

  // Validate Region exists
  const regionExists = db.regions.some(r => r.id.toUpperCase() === regionId.toUpperCase());
  if (!regionExists) {
    return res.status(404).json({ message: "Kode Wilayah tidak ditemukan!" });
  }

  db.distributors[index] = {
    id: id.toUpperCase(),
    name,
    regionId: regionId.toUpperCase(),
    phone,
    status
  };

  writeDb(db);
  addLog(req.user.id, req.user.name, `Memperbarui Distributor: ${name} (${id})`);

  res.json({ message: "Distributor berhasil diperbarui", distributor: db.distributors[index] });
});

// Delete Distributor (Admin only)
router.delete('/:id', verifyToken, requireRole(['Admin']), (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.distributors.findIndex(d => d.id.toUpperCase() === id.toUpperCase());

  if (index === -1) {
    return res.status(404).json({ message: "Distributor tidak ditemukan!" });
  }

  const deletedDist = db.distributors[index];
  db.distributors.splice(index, 1);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Menghapus Distributor: ${deletedDist.name} (${id})`);

  res.json({ message: "Distributor berhasil dihapus" });
});

module.exports = router;
