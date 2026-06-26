import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Eye, Building2, Package } from 'lucide-react';
import { api } from '../utils/api';

export default function Warehouses({ user }) {
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Side Panel/Modal State
  const [detailWarehouse, setDetailWarehouse] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    location: '',
    capacity: '',
    status: 'Active'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Warehouses
  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses', { search });
      setWarehouses(res);
    } catch (err) {
      console.error("Failed to load warehouses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWarehouses();
  };

  // View Warehouse Detail
  const handleOpenDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/warehouses/${id}`);
      setDetailWarehouse(res);
    } catch (err) {
      alert(err.message || "Gagal memuat detail gudang!");
    } finally {
      setDetailLoading(false);
    }
  };

  // Open modal for adding
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      id: '',
      name: '',
      location: '',
      capacity: '',
      status: 'Active'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (wh) => {
    setModalMode('edit');
    setFormData({
      id: wh.id,
      name: wh.name,
      location: wh.location,
      capacity: wh.capacity,
      status: wh.status
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Submit CRUD Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');

    try {
      if (modalMode === 'add') {
        await api.post('/warehouses', formData);
      } else {
        await api.put(`/warehouses/${formData.id}`, formData);
      }
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan data!");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Action
  const handleDeleteWarehouse = async (wh) => {
    if (confirm(`Apakah Anda yakin ingin menghapus gudang: ${wh.name} (${wh.id})?`)) {
      try {
        await api.delete(`/warehouses/${wh.id}`);
        fetchWarehouses();
      } catch (err) {
        alert(err.message || "Gagal menghapus gudang!");
      }
    }
  };

  const isStaffOrAdmin = user?.role === 'Admin' || user?.role === 'Staff';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="warehouses-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Master Data Gudang</h1>
          <p>Kelola data gudang penyimpanan, lokasi hub distribusi, kapasitas ruang, dan inventaris di dalamnya.</p>
        </div>
        {isStaffOrAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Tambah Gudang</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-bar">
          <div className="filter-search">
            <Search className="filter-search-icon" size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari kode, nama, lokasi gudang..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Cari</button>
        </form>
      </div>

      {/* Data Cards Grid (Alternative to table to make layout look premium & modern) */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" />
          <p>Memuat data gudang...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="card empty-card">
          <Building2 size={32} className="empty-icon" />
          <h3>Data Gudang Kosong</h3>
          <p>Tidak ditemukan data gudang penyimpanan di lokasi ini.</p>
        </div>
      ) : (
        <div className="warehouses-grid">
          {warehouses.map((wh) => (
            <div className="warehouse-item-card card" key={wh.id}>
              <div className="wh-card-header">
                <div className="wh-icon-container">
                  <Building2 size={22} />
                </div>
                <div className="wh-title">
                  <span className="wh-code">{wh.id}</span>
                  <h3>{wh.name}</h3>
                </div>
                <span className={`badge ${wh.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                  {wh.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="wh-card-body">
                <div className="wh-info-row">
                  <span className="label">Lokasi:</span>
                  <span className="value">{wh.location}</span>
                </div>
                <div className="wh-info-row">
                  <span className="label">Kapasitas:</span>
                  <span className="value font-semibold">{wh.capacity.toLocaleString()} Unit</span>
                </div>
              </div>

              <div className="wh-card-footer">
                <button className="btn btn-sm btn-outline detail-btn" onClick={() => handleOpenDetail(wh.id)}>
                  <Eye size={14} />
                  <span>Detail Inventaris</span>
                </button>

                {isStaffOrAdmin && (
                  <div className="wh-actions">
                    <button className="action-btn edit" onClick={() => handleOpenEditModal(wh)} title="Edit Gudang">
                      <Edit2 size={14} />
                    </button>
                    {isAdmin && (
                      <button className="action-btn delete" onClick={() => handleDeleteWarehouse(wh)} title="Hapus Gudang">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Gudang Panel/Modal */}
      {detailWarehouse && (
        <div className="modal-overlay" onClick={() => setDetailWarehouse(null)}>
          <div className="modal-container detail-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-modal-header-title">
                <Building2 size={18} className="header-icon-orange" />
                <h3>Detail Inventaris Gudang</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailWarehouse(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body detail-modal-body">
              <div className="detail-header-panel">
                <h2>{detailWarehouse.name} ({detailWarehouse.id})</h2>
                <p>📍 {detailWarehouse.location}</p>
                <div className="detail-capacity-metric">
                  <span>Kapasitas Maksimal: <strong>{detailWarehouse.capacity.toLocaleString()} Unit</strong></span>
                  <span className={`badge ${detailWarehouse.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                    {detailWarehouse.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <h4 className="detail-section-title">📦 Daftar Barang Tersimpan ({detailWarehouse.inventory?.length || 0} Item)</h4>
              
              {(!detailWarehouse.inventory || detailWarehouse.inventory.length === 0) ? (
                <div className="detail-empty-inventory">
                  <Package size={28} />
                  <p>Tidak ada data barang di dalam gudang ini.</p>
                </div>
              ) : (
                <div className="detail-inventory-list">
                  {detailWarehouse.inventory.map((item) => (
                    <div className="detail-inventory-item" key={item.id}>
                      <div className="item-main">
                        <span className="item-code">{item.code}</span>
                        <h5 className="item-name">{item.name}</h5>
                      </div>
                      <div className="item-stock-status">
                        <div className="stock-counter">
                          <span className="stock-num">{item.stock}</span>
                          <span className="stock-unit">Stok</span>
                        </div>
                        {item.status === 'Pending' && (
                          <span className="badge badge-warning" title="Menunggu approval admin untuk refill">
                            +{item.incomingQty} Incoming
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-dark" onClick={() => setDetailWarehouse(null)}>Tutup Detail</button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Tambah Gudang Baru' : 'Edit Data Gudang'}</h3>
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
                  <label>Kode Gudang</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: WH-004"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    disabled={modalMode === 'edit'}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Nama Gudang</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama Gudang (e.g. Gudang Hub Bandung)"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Lokasi / Alamat Gudang</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Alamat atau Kota Lokasi Gudang"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Kapasitas Simpan (Unit)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Contoh: 4000"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Status Operasional</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Nonaktif</option>
                  </select>
                </div>
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
                  {formLoading ? 'Menyimpan...' : 'Simpan Gudang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .warehouses-wrapper {
          display: flex;
          flex-direction: column;
        }

        .filter-card {
          margin-bottom: 25px;
          padding: 16px;
        }

        .warehouses-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 25px;
        }

        .warehouse-item-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px;
          min-height: 200px;
        }

        .wh-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          position: relative;
          margin-bottom: 15px;
        }

        .wh-icon-container {
          width: 42px;
          height: 42px;
          border-radius: var(--border-radius-sm);
          background-color: var(--primary-light);
          color: var(--primary-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .wh-title {
          flex-grow: 1;
          overflow: hidden;
        }
        .wh-code {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .wh-title h3 {
          font-size: 15px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wh-card-body {
          margin-bottom: 20px;
          border-top: 1px dashed var(--border-color);
          border-bottom: 1px dashed var(--border-color);
          padding: 12px 0;
        }

        .wh-info-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .wh-info-row:last-child {
          margin-bottom: 0;
        }
        .wh-info-row .label {
          color: var(--text-muted);
        }
        .wh-info-row .value {
          color: var(--text-dark);
          text-align: right;
        }

        .wh-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-btn {
          padding: 6px 12px;
          font-size: 12px;
        }

        .wh-actions {
          display: flex;
          gap: 6px;
        }

        .wh-actions .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--light-bg);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
        }
        .wh-actions .action-btn.edit:hover {
          background-color: var(--primary-light);
          color: var(--primary-hover);
          border-color: var(--primary-color);
        }
        .wh-actions .action-btn.delete:hover {
          background-color: var(--danger-light);
          color: var(--danger);
          border-color: var(--danger);
        }

        /* Detail Modal */
        .detail-modal-container {
          max-width: 600px;
        }
        
        .detail-modal-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-icon-orange {
          color: var(--primary-color);
        }

        .detail-header-panel {
          background-color: var(--primary-light);
          padding: 20px;
          border-radius: var(--border-radius-sm);
          margin-bottom: 20px;
          border: 1px solid rgba(255, 182, 146, 0.25);
        }
        .detail-header-panel h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-dark);
        }
        .detail-header-panel p {
          font-size: 12px;
          color: var(--text-muted);
          margin: 4px 0 10px 0;
        }
        
        .detail-capacity-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .detail-section-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          color: var(--text-muted);
        }

        .detail-empty-inventory {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-muted-light);
          border: 1px dashed var(--border-color);
          border-radius: var(--border-radius-sm);
          text-align: center;
        }
        .detail-empty-inventory p {
          font-size: 12px;
          margin-top: 8px;
          color: var(--text-muted);
        }

        .detail-inventory-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 5px;
        }

        .detail-inventory-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: var(--light-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
        }

        .item-main {
          display: flex;
          flex-direction: column;
        }
        .item-code {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
        }
        .item-name {
          font-size: 13px;
          font-weight: 600;
        }

        .item-stock-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stock-counter {
          text-align: right;
        }
        .stock-num {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-dark);
          line-height: 1.1;
        }
        .stock-unit {
          font-size: 9px;
          color: var(--text-muted);
        }

        .modal-error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--danger-light);
          color: var(--danger);
          padding: 10px 14px;
          border-radius: var(--border-radius-sm);
          font-size: 12px;
          margin-bottom: 15px;
          border-left: 3px solid var(--danger);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .warehouses-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .warehouses-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
