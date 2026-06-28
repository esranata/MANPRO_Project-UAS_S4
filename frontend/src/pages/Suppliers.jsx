import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Suppliers({ user }) {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    status: 'Active'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/suppliers', {
        search,
        status: statusFilter,
        page: currentPage,
        limit: 5
      });
      setSuppliers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSuppliers();
  };

  // Open modal for adding
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      status: 'Active'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (supplier) => {
    setModalMode('edit');
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      address: supplier.address,
      phone: supplier.phone,
      email: supplier.email,
      status: supplier.status
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Save/Update action
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');

    try {
      if (modalMode === 'add') {
        await api.post('/api/suppliers', formData);
      } else {
        await api.put(`/api/suppliers/${selectedSupplier.id}`, formData);
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan data!");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Action
  const handleDeleteSupplier = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus supplier: ${name}?`)) {
      try {
        await api.delete(`/api/suppliers/${id}`);
        fetchSuppliers();
      } catch (err) {
        alert(err.message || "Gagal menghapus data supplier!");
      }
    }
  };

  const isStaffOrAdmin = user?.role === 'Admin' || user?.role === 'Staff';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="suppliers-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Master Data Supplier</h1>
          <p>Kelola data mitra logistik, penyedia barang, alamat dan detail kontak operasional.</p>
        </div>
        {isStaffOrAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Tambah Supplier</span>
          </button>
        )}
      </div>

      {/* Filters & Search Bar */}
      <div className="card filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-bar">
          <div className="filter-search">
            <Search className="filter-search-icon" size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari nama, email, alamat..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Cari</button>

          <select 
            className="form-control filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">Semua Status</option>
            <option value="Active">Aktif</option>
            <option value="Inactive">Nonaktif</option>
          </select>
        </form>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" />
          <p>Memuat data supplier...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="card empty-card">
          <AlertCircle size={32} className="empty-icon" />
          <h3>Data Supplier Kosong</h3>
          <p>Tidak ditemukan data supplier yang cocok dengan filter pencarian Anda.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Supplier</th>
                  <th>Alamat</th>
                  <th>Telepon</th>
                  <th>Email</th>
                  <th>Status</th>
                  {isStaffOrAdmin && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td><strong>SPL-{String(supplier.id).padStart(3, '0')}</strong></td>
                    <td className="font-semibold">{supplier.name}</td>
                    <td className="table-address-cell">{supplier.address}</td>
                    <td>{supplier.phone}</td>
                    <td>{supplier.email}</td>
                    <td>
                      <span className={`badge ${supplier.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {supplier.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {isStaffOrAdmin && (
                      <td>
                        <div className="table-actions">
                          <button 
                            className="action-btn edit" 
                            onClick={() => handleOpenEditModal(supplier)}
                            title="Edit Supplier"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                              title="Hapus Supplier"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Menampilkan Halaman {pagination.currentPage} dari {pagination.totalPages} (Total {pagination.totalItems} data)
            </span>
            <div className="pagination-buttons">
              <button 
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Sebelumnya
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button 
                className="pagination-btn"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </>
      )}

      {/* CRUD Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Tambah Supplier Baru' : 'Edit Data Supplier'}</h3>
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
                  <label>Nama Supplier</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama perusahaan/supplier"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Alamat</label>
                  <textarea 
                    className="form-control" 
                    rows="3"
                    placeholder="Alamat kantor atau gudang supplier"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required 
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div className="form-group">
                  <label>Nomor Telepon</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nomor telepon aktif"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Email Supplier</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="email@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Status Aktif</label>
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
                  {formLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .suppliers-wrapper {
          display: flex;
          flex-direction: column;
        }

        .filter-card {
          margin-bottom: 20px;
          padding: 16px;
        }

        .table-loading, .empty-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .empty-card h3 {
          margin: 15px 0 5px 0;
          font-size: 18px;
        }
        .empty-card p {
          color: var(--text-muted);
          max-width: 400px;
        }
        .empty-icon {
          color: var(--text-muted-light);
        }

        .table-address-cell {
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .font-semibold {
          font-weight: 550;
        }

        .table-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
          background: var(--light-bg);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
        }
        .action-btn.edit:hover {
          background-color: var(--primary-light);
          color: var(--primary-hover);
          border-color: var(--primary-color);
        }
        .action-btn.delete:hover {
          background-color: var(--danger-light);
          color: var(--danger);
          border-color: var(--danger);
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
