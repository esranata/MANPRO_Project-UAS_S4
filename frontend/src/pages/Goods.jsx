import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Check, Package, Warehouse, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Goods({ user }) {
  const [goods, setGoods] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' atau 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouseId: '',
    incomingQty: '',
    stock: '0',
    status: 'Pending'
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // 1. MEMPERBAIKI CARA AMBIL DATA (MENGGUNAKAN PARAMS)
  const loadData = async () => {
    setLoading(true);
    try {
      const [goodsRes, warehousesRes] = await Promise.all([
        api.get('/goods', {
          params: {
            search: search,
            status: statusFilter,
            warehouseId: warehouseFilter
          }
        }),
        api.get('/warehouses')
      ]);
      setGoods(goodsRes || []);
      setWarehouses(warehousesRes.filter(w => w.status === 'Active') || []);
    } catch (err) {
      console.error("Gagal memuat data logistik:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. MEMASTIKAN DATA LOG-IN DI AWAL & SETIAP FILTER BERUBAH
  useEffect(() => {
    loadData();
  }, [statusFilter, warehouseFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Staff Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      code: '',
      name: '',
      warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
      incomingQty: '',
      stock: '0',
      status: 'Pending'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Admin Open Edit Modal
  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      warehouseId: item.warehouseId,
      incomingQty: item.incomingQty,
      stock: item.stock,
      status: item.status
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // 3. MEMPERBAIKI PROSES SIMPAN DATA (POST & PUT)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');

    try {
      if (modalMode === 'add') {
        // Mengirimkan data inputan staff (Pastikan incomingQty dikonversi ke Number)
        await api.post('/goods', {
          code: formData.code,
          name: formData.name,
          warehouseId: Number(formData.warehouseId),
          incomingQty: Number(formData.incomingQty)
        });
      } else {
        // Admin melakukan update/edit data
        await api.put(`/goods/${selectedItem.id}`, {
          ...formData,
          warehouseId: Number(formData.warehouseId),
          incomingQty: Number(formData.incomingQty),
          stock: Number(formData.stock)
        });
      }
      setIsModalOpen(false);
      // Panggil ulang loadData agar data terbaru langsung muncul di tabel
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Gagal menyimpan data!");
    } finally {
      setFormLoading(false);
    }
  };

  // Admin Accepts Incoming Goods
  const handleAcceptGoods = async (id, name, qty) => {
    if (confirm(`Apakah Anda yakin menyetujui barang masuk: ${name} (+${qty} unit)? Stok aktif gudang akan terisi.`)) {
      try {
        const res = await api.post(`/goods/${id}/accept`);
        alert(res.message || "Barang berhasil di-refill!");
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || err.message || "Gagal menyetujui barang masuk.");
      }
    }
  };

  // Admin Deletes incorrect goods
  const handleDeleteGoods = async (id, name) => {
    if (confirm(`Apakah Anda yakin menghapus data barang: ${name}?`)) {
      try {
        await api.delete(`/goods/${id}`);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || err.message || "Gagal menghapus barang.");
      }
    }
  };

  const isStaff = user?.role === 'Staff';
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const isStaffOrAdmin = isStaff || isAdmin;

  return (
    <div className="goods-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Logistik & Refill Barang</h1>
          <p>Alur pengisian barang masuk gudang. Staff menginput, Admin menyetujui (Refill), dan Manager memantau stok.</p>
        </div>
        {isStaffOrAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Input Barang Masuk</span>
          </button>
        )}
      </div>

      {/* Role Guide */}
      <div className="card role-indicator-card">
        <span className="role-guide-icon">🔑</span>
        <div className="role-guide-text">
          <p>
            Mode Akses: <strong>{user?.role === 'Staff' ? 'Staff Operasional' : user?.role}</strong>. 
            {isStaff && " Anda dapat mendaftarkan barang kosong/baru serta menginput jumlah masuk ke gudang."}
            {isAdmin && " Anda memiliki wewenang mengedit data barang, menghapus inputan yang tidak sesuai, dan melakukan 'Accept' barang masuk."}
            {isManager && " Anda memiliki akses pantau (Read-Only) untuk melihat kondisi stok barang masuk."}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-bar">
          <div className="filter-search">
            <Search className="filter-search-icon" size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari kode atau nama barang..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Cari</button>

          <select 
            className="form-control filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Semua Status</option>
            <option value="Pending">Menunggu Approval (Pending)</option>
            <option value="Accepted">Sudah di-Refill (Accepted)</option>
          </select>

          <select 
            className="form-control filter-select"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="All">Semua Gudang</option>
            <option value="All">Semua Gudang</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </form>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" />
          <p>Memuat data barang...</p>
        </div>
      ) : goods.length === 0 ? (
        <div className="card empty-card">
          <Package size={32} className="empty-icon" />
          <h3>Data Barang Tidak Ditemukan</h3>
          <p>Belum ada entri barang yang diinput atau cocok dengan filter di atas.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Lokasi Gudang</th>
                <th>Stok Aktif</th>
                <th>Barang Masuk (Inputan)</th>
                <th>Status Refill</th>
                <th>Aksi / Workflow</th>
              </tr>
            </thead>
            <tbody>
              {goods.map((item) => (
                <tr key={item.id} className={item.status === 'Pending' ? 'row-pending-glow' : ''}>
                  <td><strong>{item.code}</strong></td>
                  <td className="font-semibold">{item.name}</td>
                  <td>
                    <div className="warehouse-cell-info">
                      <Warehouse size={14} className="cell-icon" />
                      <span>{item.warehouseName || 'Tidak Diketahui'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`stock-badge ${Number(item.stock) === 0 ? 'stock-empty' : 'stock-available'}`}>
                      {item.stock} Unit
                    </span>
                  </td>
                  <td>
                    {item.incomingQty > 0 ? (
                      <span className="incoming-qty-text text-orange font-semibold">
                        +{item.incomingQty} Unit
                      </span>
                    ) : (
                      <span className="incoming-qty-text text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${item.status === 'Accepted' ? 'badge-success' : 'badge-warning'}`}>
                      {item.status === 'Accepted' ? 'Refilled / Ready' : 'Menunggu Approval'}
                    </span>
                  </td>
                  <td>
                    <div className="workflow-actions">
                      {isAdmin && (
                        <>
                          {item.status === 'Pending' && (
                            <button 
                              className="btn btn-sm btn-primary accept-action-btn"
                              onClick={() => handleAcceptGoods(item.id, item.name, item.incomingQty)}
                              title="Setujui dan Refill Stok"
                            >
                              <Check size={14} />
                              <span>Accept</span>
                            </button>
                          )}
                          <button 
                            className="action-btn edit" 
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Data Barang"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteGoods(item.id, item.name)}
                            title="Hapus Barang"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}

                      {isStaff && (
                        <span className="action-text-info">
                          {item.status === 'Pending' ? 'Menunggu Admin' : 'Refill Selesai'}
                        </span>
                      )}

                      {isManager && (
                        <span className={`manager-view-badge ${item.status === 'Accepted' ? 'ready' : 'pending'}`}>
                          {item.status === 'Accepted' ? '✓ Siap Disalurkan' : '⚠ Tertahan di Inputan'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Input Barang Masuk Baru' : 'Edit Data Barang (Admin)'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div className="modal-error-alert">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Kode Barang</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: BRG-005"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    disabled={modalMode === 'edit'}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Nama Barang</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: Semen Gresik"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Gudang Tujuan</label>
                  <select 
                    className="form-control"
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({...formData, warehouseId: e.target.value})}
                    required
                  >
                    <option value="">-- Pilih Gudang --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                    ))}
                  </select>
                </div>

                {modalMode === 'add' ? (
                  <div className="form-group">
                    <label>Jumlah Barang Masuk (Refill Qty)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Masukkan kuantitas barang masuk"
                      value={formData.incomingQty}
                      onChange={(e) => setFormData({...formData, incomingQty: e.target.value})}
                      required 
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Stok Aktif Saat Ini</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Jumlah Masuk (Pending)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={formData.incomingQty}
                        onChange={(e) => setFormData({...formData, incomingQty: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="Pending">Pending Approval</option>
                        <option value="Accepted">Accepted / Refilled</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={formLoading}
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}