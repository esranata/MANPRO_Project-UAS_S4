import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Check, Package, Warehouse, AlertCircle, Eye, CornerRightDown } from 'lucide-react';
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
  const [modalMode, setModalMode] = useState('add'); // 'add' (staff input), 'edit' (admin edit)
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    warehouseId: '',
    incomingQty: '',
    stock: '0', // Admin edit only
    status: 'Pending'
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Load goods and warehouses
  const loadData = async () => {
    setLoading(true);
    try {
      const [goodsRes, warehousesRes] = await Promise.all([
        api.get('/api/goods', {
          search,
          status: statusFilter,
          warehouseId: warehouseFilter
        }),
        api.get('/warehouses')
      ]);
      setGoods(goodsRes);
      setWarehouses(warehousesRes.filter(w => w.status === 'Active'));
    } catch (err) {
      console.error("Gagal memuat data logistik:", err);
    } finally {
      setLoading(false);
    }
  };

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

  // CRUD Form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');

    try {
      if (modalMode === 'add') {
        // Staff inputs incoming goods
        await api.post('/api/goods', {
          code: formData.code,
          name: formData.name,
          warehouseId: formData.warehouseId,
          incomingQty: formData.incomingQty
        });
      } else {
        // Admin edits goods details
        await api.put(`/api/goods/${selectedItem.id}`, formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan data!");
    } finally {
      setFormLoading(false);
    }
  };

  // Admin Accepts Incoming Goods (Refills Stock)
  const handleAcceptGoods = async (id, name, qty) => {
    if (confirm(`Apakah Anda yakin menyetujui barang masuk: ${name} (+${qty} unit)? Stok aktif gudang akan terisi.`)) {
      try {
        const res = await api.post(`/api/goods/${id}/accept`);
        alert(res.message);
        loadData();
      } catch (err) {
        alert(err.message || "Gagal menyetujui barang masuk.");
      }
    }
  };

  // Admin Deletes incorrect goods
  const handleDeleteGoods = async (id, name) => {
    if (confirm(`Apakah Anda yakin menghapus data barang: ${name}? (Tindakan ini untuk menghapus inputan yang tidak sesuai)`)) {
      try {
        await api.delete(`/api/goods/${id}`);
        loadData();
      } catch (err) {
        alert(err.message || "Gagal menghapus barang.");
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

      {/* Role Guide Notification Badge */}
      <div className="card role-indicator-card">
        <span className="role-guide-icon">🔑</span>
        <div className="role-guide-text">
          <p>
            Mode Akses: <strong>{user?.role === 'Staff' ? 'Staff Operasional' : user?.role}</strong>. 
            {isStaff && " Anda dapat mendaftarkan barang kosong/baru serta menginput jumlah masuk ke gudang."}
            {isAdmin && " Anda memiliki wewenang mengedit data barang, menghapus inputan yang tidak sesuai, dan melakukan 'Accept' barang masuk untuk melakukan refill."}
            {isManager && " Anda memiliki akses pantau (Read-Only) untuk melihat kondisi stok barang masuk sebelum disalurkan ke distributor."}
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
                      <span>{item.warehouseName}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`stock-badge ${item.stock === 0 ? 'stock-empty' : 'stock-available'}`}>
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
                      {/* Admin Actions */}
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
                            title="Hapus Barang (Tidak Sesuai)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}

                      {/* Staff Actions */}
                      {isStaff && (
                        <span className="action-text-info">
                          {item.status === 'Pending' ? 'Menunggu Admin' : 'Refill Selesai'}
                        </span>
                      )}

                      {/* Manager Actions */}
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

      {/* Input / Edit Modal Form */}
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
                    placeholder="Contoh: Semen Gresik / Cat Putih"
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
                    {warehouses.length === 0 ? (
                      <option value="">Tidak ada gudang aktif!</option>
                    ) : (
                      warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                      ))
                    )}
                  </select>
                </div>

                {/* If Staff is adding OR Admin is editing */}
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
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      *Barang akan disetor ke database dengan status "Pending Approval" menunggu verifikasi Admin.
                    </small>
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

      <style>{`
        .goods-wrapper {
          display: flex;
          flex-direction: column;
        }

        .role-indicator-card {
          background-color: var(--primary-light);
          border: 1px solid var(--secondary-2);
          display: flex;
          gap: 15px;
          padding: 16px;
          margin-bottom: 20px;
          align-items: center;
        }
        .role-guide-icon {
          font-size: 24px;
        }
        .role-guide-text p {
          font-size: 12.5px;
          color: var(--text-dark);
          line-height: 1.5;
        }

        .filter-card {
          margin-bottom: 20px;
          padding: 16px;
        }

        .row-pending-glow {
          background-color: rgba(230, 162, 60, 0.04);
        }
        .row-pending-glow:hover {
          background-color: rgba(230, 162, 60, 0.08) !important;
        }

        .warehouse-cell-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .cell-icon {
          color: var(--text-muted);
        }

        .stock-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .stock-empty {
          background-color: var(--danger-light);
          color: var(--danger);
        }
        .stock-available {
          background-color: var(--light-bg);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
        }

        .text-orange {
          color: #d88f80;
        }
        
        .font-semibold {
          font-weight: 550;
        }

        .workflow-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .accept-action-btn {
          padding: 6px 12px;
          font-size: 12px;
          background-color: var(--success);
          color: white;
        }
        .accept-action-btn:hover {
          background-color: #529b2e;
        }

        .workflow-actions .action-btn {
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
        .workflow-actions .action-btn.edit:hover {
          background-color: var(--primary-light);
          color: var(--primary-hover);
          border-color: var(--primary-color);
        }
        .workflow-actions .action-btn.delete:hover {
          background-color: var(--danger-light);
          color: var(--danger);
          border-color: var(--danger);
        }

        .action-text-info {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }

        .manager-view-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .manager-view-badge.ready {
          background-color: var(--success-light);
          color: var(--success);
        }
        .manager-view-badge.pending {
          background-color: var(--warning-light);
          color: var(--warning);
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
      `}</style>
    </div>
  );
}
