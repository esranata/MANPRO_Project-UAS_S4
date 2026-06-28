import React, { useState, useEffect } from 'react';
import { Plus, Edit2, KeyRound, UserMinus, UserCheck, X, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);

  // Modal Reset Password State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    password: '', // only for add mode
    status: 'Active'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsers(res);
    } catch (err) {
      console.error("Gagal memuat manajemen user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      email: '',
      role: 'Staff',
      password: '',
      status: 'Active'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setModalMode('edit');
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
      status: u.status
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenResetModal = (u) => {
    setSelectedUser(u);
    setResetPasswordVal('');
    setErrorMsg('');
    setIsResetOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');

    try {
      if (modalMode === 'add') {
        await api.post('/api/users', formData);
      } else {
        await api.put(`/api/users/${selectedUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message || "Gagal memproses data user!");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordVal) {
      setErrorMsg("Password baru wajib diisi!");
      return;
    }
    setFormLoading(true);
    setErrorMsg('');

    try {
      await api.post(`/api/users/${selectedUser.id}/reset-password`, {
        newPassword: resetPasswordVal
      });
      alert(`Password untuk user ${selectedUser.name} berhasil di-reset.`);
      setIsResetOpen(false);
    } catch (err) {
      setErrorMsg(err.message || "Gagal mereset password!");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (id, name, currentStatus) => {
    const actionText = currentStatus === 'Active' ? 'menonaktifkan' : 'mengaktifkan';
    if (confirm(`Apakah Anda yakin ingin ${actionText} user: ${name}?`)) {
      try {
        const res = await api.post(`/api/users/${id}/toggle-status`);
        alert(res.message);
        fetchUsers();
      } catch (err) {
        alert(err.message || "Gagal mengubah status user.");
      }
    }
  };

  return (
    <div className="users-management-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Manajemen User</h1>
          <p>Kelola hak akses portal untuk Admin, Staff Operasional, dan Manager.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" />
          <p>Memuat data user...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role Akses</th>
                <th>Status Akun</th>
                <th>Aksi Pengelolaan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role === 'Staff' ? 'Staff Operasional' : u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn edit" onClick={() => handleOpenEditModal(u)} title="Edit User">
                        <Edit2 size={13} />
                      </button>
                      <button className="action-btn key-btn" onClick={() => handleOpenResetModal(u)} title="Reset Password">
                        <KeyRound size={13} />
                      </button>
                      <button 
                        className={`action-btn ${u.status === 'Active' ? 'disable-btn' : 'enable-btn'}`}
                        onClick={() => handleToggleStatus(u.id, u.name, u.status)}
                        title={u.status === 'Active' ? 'Nonaktifkan User' : 'Aktifkan User'}
                      >
                        {u.status === 'Active' ? <UserMinus size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Tambah User Baru' : 'Edit Data User'}</h3>
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
                  <label>Nama Lengkap</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nama Lengkap User"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="username@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Role / Hak Akses</label>
                  <select 
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff Operasional</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                {modalMode === 'add' && (
                  <div className="form-group">
                    <label>Password Akun</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Masukkan password awal"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required 
                    />
                  </div>
                )}

                {modalMode === 'edit' && (
                  <div className="form-group">
                    <label>Status Akun</label>
                    <select 
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Aktif</option>
                      <option value="Inactive">Nonaktif</option>
                    </select>
                  </div>
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
                  {formLoading ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Reset Password: {selectedUser?.name}</h3>
              <button className="modal-close-btn" onClick={() => setIsResetOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div className="modal-error-alert">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                  Silakan masukkan password baru untuk user <strong>{selectedUser?.email}</strong>.
                </p>

                <div className="form-group">
                  <label>Password Baru</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Masukkan password baru"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsResetOpen(false)}
                  disabled={formLoading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={formLoading}
                >
                  {formLoading ? 'Mereset...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .users-management-wrapper {
          display: flex;
          flex-direction: column;
        }

        .font-semibold {
          font-weight: 550;
        }

        .table-actions {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--light-bg);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
          transition: var(--transition-fast);
        }
        .action-btn.edit:hover {
          background-color: var(--primary-light);
          color: var(--primary-hover);
          border-color: var(--primary-color);
        }
        .action-btn.key-btn:hover {
          background-color: var(--warning-light);
          color: var(--warning);
          border-color: var(--warning);
        }
        .action-btn.disable-btn:hover {
          background-color: var(--danger-light);
          color: var(--danger);
          border-color: var(--danger);
        }
        .action-btn.enable-btn:hover {
          background-color: var(--success-light);
          color: var(--success);
          border-color: var(--success);
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
