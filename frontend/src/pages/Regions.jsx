import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, MapPin } from 'lucide-react';
import { api } from '../utils/api';

export default function Regions({ user }) {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: ''
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Load regions list
  const loadRegions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/regions');
      setRegions(res);
    } catch (err) {
      console.error("Gagal memuat wilayah:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegions();
  }, []);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      id: '',
      name: ''
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (r) => {
    setModalMode('edit');
    setFormData({
      id: r.id,
      name: r.name
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
        await api.post('/api/regions', formData);
      } else {
        await api.put(`/api/regions/${formData.id}`, formData);
      }
      setIsModalOpen(false);
      loadRegions();
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan data!");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Action
  const handleDeleteRegion = async (r) => {
    if (confirm(`Apakah Anda yakin ingin menghapus wilayah: ${r.name} (${r.id})?`)) {
      try {
        await api.delete(`/api/regions/${r.id}`);
        loadRegions();
      } catch (err) {
        alert(err.message || "Gagal menghapus wilayah!");
      }
    }
  };

  const isStaffOrAdmin = user?.role === 'Admin' || user?.role === 'Staff';
  const isAdmin = user?.role === 'Admin';

  return (
    <div className="regions-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Master Data Wilayah</h1>
          <p>Daftar wilayah cakupan distribusi produk logistik beserta jumlah distributor yang terdaftar aktif.</p>
        </div>
        {isStaffOrAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Tambah Wilayah</span>
          </button>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" />
          <p>Memuat data wilayah...</p>
        </div>
      ) : regions.length === 0 ? (
        <div className="card empty-card">
          <MapPin size={32} className="empty-icon" />
          <h3>Data Wilayah Kosong</h3>
          <p>Belum ada data wilayah operasional terdaftar di sistem.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Kode Wilayah</th>
                <th>Nama Wilayah</th>
                <th>Jumlah Distributor Terdaftar</th>
                {isStaffOrAdmin && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {regions.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.id}</strong></td>
                  <td className="font-semibold">{r.name}</td>
                  <td>
                    <span className="distributor-count-badge">
                      {r.distributorCount} Distributor
                    </span>
                  </td>
                  {isStaffOrAdmin && (
                    <td>
                      <div className="table-actions">
                        <button className="action-btn edit" onClick={() => handleOpenEditModal(r)} title="Edit Wilayah">
                          <Edit2 size={14} />
                        </button>
                        {isAdmin && (
                          <button className="action-btn delete" onClick={() => handleDeleteRegion(r)} title="Hapus Wilayah">
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
              <h3>{modalMode === 'add' ? 'Tambah Wilayah Baru' : 'Edit Nama Wilayah'}</h3>
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
                  <label>Kode Wilayah</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: REG-JABAR"
                    value={formData.id}
                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                    disabled={modalMode === 'edit'}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Nama Wilayah</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: Jawa Barat / Kalimantan Timur"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
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
                  {formLoading ? 'Menyimpan...' : 'Simpan Wilayah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .regions-wrapper {
          display: flex;
          flex-direction: column;
        }

        .distributor-count-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          background-color: var(--primary-light);
          color: var(--primary-hover);
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 182, 146, 0.2);
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
