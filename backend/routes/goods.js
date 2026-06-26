const express = require('express');
const router = express.Router();
const { readDb, writeDb, addLog } = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get all goods (Admin, Staff, Manager can read)
router.get('/', verifyToken, (req, res) => {
  const db = readDb();
  
  // Join warehouse details for frontend convenience
  const goodsList = db.goods.map(g => {
    const wh = db.warehouses.find(w => w.id.toUpperCase() === g.warehouseId.toUpperCase());
    return {
      ...g,
      warehouseName: wh ? wh.name : 'Gudang Tidak Diketahui'
    };
  });

  const { search, status, warehouseId } = req.query;
  let filtered = [...goodsList];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(g => 
      g.code.toLowerCase().includes(q) || 
      g.name.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'All') {
    filtered = filtered.filter(g => g.status === status);
  }

  if (warehouseId && warehouseId !== 'All') {
    filtered = filtered.filter(g => g.warehouseId.toUpperCase() === warehouseId.toUpperCase());
  }

  res.json(filtered);
});

// Staff (or Admin) inputs incoming goods
router.post('/', verifyToken, requireRole(['Staff', 'Admin']), (req, res) => {
  const { code, name, warehouseId, incomingQty } = req.body;

  if (!code || !name || !warehouseId || incomingQty === undefined) {
    return res.status(400).json({ message: "Kode, nama, gudang, dan jumlah masuk wajib diisi!" });
  }

  const qty = Number(incomingQty);
  if (qty <= 0) {
    return res.status(400).json({ message: "Jumlah masuk harus lebih besar dari 0!" });
  }

  const db = readDb();

  // Validate that the warehouse exists and is active
  const warehouse = db.warehouses.find(w => w.id.toUpperCase() === warehouseId.toUpperCase());
  if (!warehouse) {
    return res.status(404).json({ message: "Gudang tidak ditemukan!" });
  }
  if (warehouse.status !== 'Active') {
    return res.status(400).json({ message: "Gudang ini tidak aktif!" });
  }

  // Check if this item already exists in the warehouse
  const existingIndex = db.goods.findIndex(g => 
    g.code.toUpperCase() === code.toUpperCase() && 
    g.warehouseId.toUpperCase() === warehouseId.toUpperCase()
  );

  let targetItem;

  if (existingIndex !== -1) {
    // If it exists, overwrite/append the incoming quantity and set status back to Pending
    db.goods[existingIndex].incomingQty = (db.goods[existingIndex].incomingQty || 0) + qty;
    db.goods[existingIndex].status = "Pending";
    targetItem = db.goods[existingIndex];
  } else {
    // Create new goods entry
    const newId = db.goods.length > 0 ? Math.max(...db.goods.map(g => g.id)) + 1 : 1;
    targetItem = {
      id: newId,
      code: code.toUpperCase(),
      name,
      warehouseId: warehouseId.toUpperCase(),
      stock: 0, // Starts at 0 until approved
      incomingQty: qty,
      status: "Pending"
    };
    db.goods.push(targetItem);
  }

  writeDb(db);
  addLog(req.user.id, req.user.name, `Staff menginput barang masuk: ${name} (${qty} unit) ke ${warehouse.name}`);

  res.status(201).json({ message: "Data barang masuk berhasil diinput, menunggu persetujuan Admin.", goods: targetItem });
});

// Admin edits goods details (only admin can modify)
router.put('/:id', verifyToken, requireRole(['Admin']), (req, res) => {
  const id = Number(req.params.id);
  const { code, name, warehouseId, stock, incomingQty, status } = req.body;

  if (!code || !name || !warehouseId || stock === undefined || incomingQty === undefined || !status) {
    return res.status(400).json({ message: "Semua field wajib diisi!" });
  }

  const db = readDb();
  const index = db.goods.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Data barang tidak ditemukan!" });
  }

  const warehouse = db.warehouses.find(w => w.id.toUpperCase() === warehouseId.toUpperCase());
  if (!warehouse) {
    return res.status(404).json({ message: "Gudang tidak ditemukan!" });
  }

  db.goods[index] = {
    id,
    code: code.toUpperCase(),
    name,
    warehouseId: warehouseId.toUpperCase(),
    stock: Number(stock),
    incomingQty: Number(incomingQty),
    status
  };

  writeDb(db);
  addLog(req.user.id, req.user.name, `Admin mengedit data barang: ${name}`);

  res.json({ message: "Data barang berhasil diperbarui", goods: db.goods[index] });
});

// Admin deletes incorrect goods (melihat data barang, menghapus barang yang tidak sesuai inputan)
router.delete('/:id', verifyToken, requireRole(['Admin']), (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const index = db.goods.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Data barang tidak ditemukan!" });
  }

  const deletedItem = db.goods[index];
  db.goods.splice(index, 1);
  writeDb(db);

  addLog(req.user.id, req.user.name, `Admin menghapus barang tidak sesuai inputan: ${deletedItem.name}`);

  res.json({ message: "Barang tidak sesuai inputan berhasil dihapus" });
});

// Admin accepts incoming goods (refill stock)
router.post('/:id/accept', verifyToken, requireRole(['Admin']), (req, res) => {
  const id = Number(req.params.id);
  const db = readDb();
  const index = db.goods.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Data barang tidak ditemukan!" });
  }

  const item = db.goods[index];
  if (item.status === 'Accepted' || item.incomingQty === 0) {
    return res.status(400).json({ message: "Barang sudah berstatus Accepted atau tidak ada jumlah masuk!" });
  }

  const addedQty = item.incomingQty;
  item.stock = (item.stock || 0) + addedQty;
  item.incomingQty = 0;
  item.status = 'Accepted';

  db.goods[index] = item;
  writeDb(db);

  addLog(req.user.id, req.user.name, `Admin menyetujui barang masuk: ${item.name} (+${addedQty} unit refilled)`);

  res.json({ message: `Barang masuk disetujui. Stok berhasil di-refill sebanyak ${addedQty} unit.`, goods: item });
});

module.exports = router;
