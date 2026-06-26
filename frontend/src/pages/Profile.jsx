import React, { useState } from 'react';
import { User, Shield, Mail, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Profile({ user, onProfileUpdate }) {
  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Handle Profile Save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await api.put('/auth/update-profile', profileData);
      api.setUser(res.user);
      onProfileUpdate(res.user);
      setProfileSuccess("Profil Anda berhasil diperbarui!");
    } catch (err) {
      setProfileError(err.message || "Gagal memperbarui profil.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Save
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError("Konfirmasi password baru tidak cocok!");
      return;
    }

    if (passwords.newPassword.length < 5) {
      setPassError("Password baru minimal harus berisi 5 karakter!");
      return;
    }

    setPassLoading(true);

    try {
      await api.put('/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      setPassSuccess("Password berhasil diubah!");
      setPasswords({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPassError(err.message || "Gagal mengubah password.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Profil Saya</h1>
          <p>Kelola data informasi akun Anda dan ubah password pengamanan secara berkala.</p>
        </div>
      </div>

      <div className="grid-cols-3">
        {/* Left Side: Avatar Widget (occupies 1 column) */}
        <div className="card profile-avatar-card">
          <div className="avatar-graphic">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3>{user?.name}</h3>
          <p className="profile-email-desc">{user?.email}</p>
          
          <div className="profile-details-badge">
            <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
              {user?.role === 'Staff' ? 'Staff Operasional' : user?.role}
            </span>
          </div>

          <div className="profile-info-footer">
            <div className="footer-row">
              <Shield size={14} />
              <span>Status Akun: <strong>Aktif</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Forms (occupies 2 columns) */}
        <div className="profile-forms-column col-span-2">
          {/* Edit Profile Card */}
          <div className="card form-card">
            <div className="widget-header">
              <h3>Ubah Detail Informasi</h3>
              <p>Perbarui nama lengkap dan alamat email operasional Anda.</p>
            </div>

            <form onSubmit={handleProfileSubmit}>
              {profileError && (
                <div className="profile-alert danger">
                  <AlertCircle size={16} />
                  <span>{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="profile-alert success">
                  <CheckCircle size={16} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label>Nama Lengkap</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={16} />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alamat Email</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" size={16} />
                  <input 
                    type="email" 
                    className="form-control" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? 'Memproses...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card form-card">
            <div className="widget-header">
              <h3>Ganti Password</h3>
              <p>Ubah password lama Anda dengan password pengamanan yang baru.</p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              {passError && (
                <div className="profile-alert danger">
                  <AlertCircle size={16} />
                  <span>{passError}</span>
                </div>
              )}
              {passSuccess && (
                <div className="profile-alert success">
                  <CheckCircle size={16} />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label>Password Lama</label>
                <div className="input-with-icon">
                  <KeyRound className="input-icon" size={16} />
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Masukkan password lama"
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '15px', marginBottom: '0' }}>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label>Password Baru</label>
                  <div className="input-with-icon">
                    <KeyRound className="input-icon" size={16} />
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Minimal 5 karakter"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label>Konfirmasi Password Baru</label>
                  <div className="input-with-icon">
                    <KeyRound className="input-icon" size={16} />
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Ulangi password baru"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                      required 
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={passLoading}>
                {passLoading ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page-wrapper {
          display: flex;
          flex-direction: column;
        }

        .profile-avatar-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 30px 20px;
        }

        .avatar-graphic {
          width: 86px;
          height: 86px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-1));
          color: var(--text-dark);
          font-size: 32px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          box-shadow: var(--shadow-md);
        }

        .profile-avatar-card h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .profile-email-desc {
          color: var(--text-muted);
          font-size: 12px;
          margin-bottom: 15px;
        }

        .profile-details-badge {
          margin-bottom: 25px;
        }

        .profile-info-footer {
          width: 100%;
          border-top: 1px solid var(--border-color);
          padding-top: 18px;
        }

        .footer-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--text-muted);
        }

        .profile-forms-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .col-span-2 {
          grid-column: span 2;
        }

        .form-card {
          padding: 24px;
        }

        .input-with-icon {
          position: relative;
        }
        .input-with-icon .form-control {
          padding-left: 36px;
        }
        .input-with-icon .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .profile-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: var(--border-radius-sm);
          font-size: 12px;
          margin-bottom: 18px;
        }
        .profile-alert.danger {
          background-color: var(--danger-light);
          color: var(--danger);
          border-left: 3px solid var(--danger);
        }
        .profile-alert.success {
          background-color: var(--success-light);
          color: var(--success);
          border-left: 3px solid var(--success);
        }

        @media (max-width: 1024px) {
          .col-span-2 {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
