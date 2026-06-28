import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Users } from 'lucide-react';
import { api } from '../utils/api';

export default function Distributors({ user }) {
  const [distributors, setDistributors] = useState([]);
  const [regions, setRegions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    regionId: '',
    phone: '',
    status: 'Active'
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Load distributors and regions
  const loadData = async () => {
    setLoading(true);
    try {
      const [distRes, regRes] = await Promise.all([
        api.get('/api/distributors', { search }),
        api.get('/api/regions')
      ]);
      setDistributors(distRes);
      setRegions(regRes);
    } catch (err) {
      console.error("Gagal memuat data distributor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Open modal for adding
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      id: '',
      name: '',
      regionId: regions.length > 0 ? regions[0].id : '',
      phone: '',
      status: 'Active'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (d) => {
    setModalMode('edit');
    setFormData({
      id: d.id,
      name: d.name,
      regionId: d.regionId,
      phone: d.phone,
      status: d.status
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
        await api.post('/api/distributors', formData);
      } else {
        await api.put(`/api/distributors/${formData.id}`, formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan data!");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Action
  const handleDeleteDistributor = async (d) => {
    if (confirm(`Apakah Anda yakin ingin menghapus distributor: ${d.name} (${d.id})?`)) {
      try {
        await api.delete(`/api/distributors/${d.id}`);
        loadData();
      } catch (err) {
        alert(err.message || "Gagal menghapus distributor!");
      }
    }
  };

  const isStaffOrAdmin = user?.role === 'Admin' || user?.role === 'Staff';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="distributors-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Master Data Distributor</h1>
          <p>Kelola data agen distributor penyaluran, relasi wilayah kerja, nomor kontak telepon, dan status rekan.</p>
        </div>
        {isStaffOrAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Tambah Distributor</span>
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
              placeholder="Cari kode, nama, wilayah, telepon..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Cari</button>
        </form>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" />
          <p>Memuat data distributor...</p>
        </div>
      ) : distributors.length === 0 ? (
        <div className="card empty-card">
          <Users size={32} className="empty-icon" />
          <h3>Data Distributor Kosong</h3>
          <p>Tidak ditemukan data distributor terdaftar yang sesuai filter pencarian Anda.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Distributor</th>
                <th>Wilayah Distribusi</th>
                <th>Telepon Kontak</th>
                <th>Status Kemitraan</th>
                {isStaffOrAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {distributors.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.id}</strong></td>
                  <td className="font-semibold">{d.name}</td>
                  <td>
                    <span className="badge badge-info">{d.regionName}</span>
                  </td>
                  <td>{d.phone}</td>
                  <td>
                    <span className={`badge ${d.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {d.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  {isStaffOrAdmin && (
                    <td>
                      <div className="table-actions">
                        <button className="action-btn edit" onClick={() => handleOpenEditModal(d)} title="Edit Distributor">
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button className="action-btn delete" onClick={() => handleDeleteDistributor(d)} title="Hapus Distributor">
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
      )}

      {/* CRUD Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Tambah Distributor Baru' : 'Edit Data Distributor'}</h3>
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
                  <label>Kode Distributor</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: DST-004"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    disabled={modalMode === 'edit'}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Nama Distributor</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama lengkap perusahaan distributor"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Wilayah Kerja</label>
                  <select 
                    className="form-control"
                    value={formData.regionId}
                    onChange={(e) => setFormData({...formData, regionId: e.target.value})}
                    required
                  >
                    {regions.length === 0 ? (
                      <option value="">Tidak ada wilayah terdaftar!</option>
                    ) : (
                      regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Nomor Telepon</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nomor kontak aktif"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Status Kemitraan</label>
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
                  {formLoading ? 'Menyimpan...' : 'Simpan Distributor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .distributors-wrapper {
          display: flex;
          flex-direction: column;
        }

        .filter-card {
          margin-bottom: 20px;
          padding: 16px;
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
