import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, RefreshCw, Calendar, User } from 'lucide-react';
import { api } from '../utils/api';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/logs');
      setLogs(res || []);
    } catch (err) {
      console.error("Gagal memuat log aktivitas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs locally based on search
  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      new Date(log.timestamp).toLocaleString('id-ID').toLowerCase().includes(q)
    );
  });

  return (
    <div className="activity-logs-wrapper">
      <div className="page-header">
        <div className="page-title">
          <h1>Activity Log</h1>
          <p>Daftar riwayat aksi sistem: Login User, Tambah Data, Edit Data, Hapus Data, & Refill Stok.</p>
        </div>
        <button className="btn btn-outline btn-refresh" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card filter-card">
        <div className="filter-bar">
          <div className="filter-search" style={{ maxWidth: '100%' }}>
            <Search className="filter-search-icon" size={16} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari berdasarkan User, Aktivitas, atau Tanggal..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Logs timeline layout */}
      {loading ? (
        <div className="table-loading">
          <div className="spinner" />
          <p>Memuat log audit...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card empty-card">
          <ClipboardList size={32} className="empty-icon" />
          <h3>Log Kosong</h3>
          <p>Tidak ditemukan log aktivitas yang sesuai dengan filter Anda.</p>
        </div>
      ) : (
        <div className="card logs-timeline-card">
          <div className="logs-timeline">
            {filteredLogs.map((log) => {
              // Get nice style for actions
              const act = log.action.toLowerCase();
              let iconBg = 'bg-gray';
              let badgeText = 'System';
              
              if (act.includes('login')) {
                iconBg = 'bg-blue';
                badgeText = 'Login';
              } else if (act.includes('menambahkan') || act.includes('membuat') || act.includes('menginput')) {
                iconBg = 'bg-green';
                badgeText = 'Tambah';
              } else if (act.includes('memperbarui') || act.includes('mengedit') || act.includes('mengubah')) {
                iconBg = 'bg-orange';
                badgeText = 'Edit';
              } else if (act.includes('menghapus')) {
                iconBg = 'bg-red';
                badgeText = 'Hapus';
              } else if (act.includes('menyetujui') || act.includes('refill')) {
                iconBg = 'bg-purple';
                badgeText = 'Refill';
              }

              return (
                <div className="timeline-node" key={log.id}>
                  {/* Left Column: Date */}
                  <div className="node-date">
                    <Calendar size={12} className="node-date-icon" />
                    <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                  </div>

                  {/* Middle Column: Indicator Line */}
                  <div className="node-indicator">
                    <div className={`node-dot ${iconBg}`} />
                    <div className="node-line" />
                  </div>

                  {/* Right Column: Log Content */}
                  <div className="node-content">
                    <div className="node-header">
                      <div className="node-user">
                        <User size={12} />
                        <span>{log.userName}</span>
                      </div>
                      <span className={`node-badge-type ${badgeText.toLowerCase()}`}>
                        {badgeText}
                      </span>
                    </div>
                    <p className="node-action">{log.action}</p>
                    <span className="node-id">Log ID: #{log.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .activity-logs-wrapper {
          display: flex;
          flex-direction: column;
        }

        .btn-refresh .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .filter-card {
          margin-bottom: 20px;
          padding: 16px;
        }

        .logs-timeline-card {
          padding: 30px;
        }

        .logs-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-node {
          display: grid;
          grid-template-columns: 180px 40px 1fr;
          position: relative;
        }

        .node-date {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          font-size: 12px;
          padding: 15px 0;
        }
        .node-date-icon {
          flex-shrink: 0;
        }

        .node-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .node-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 5;
          margin-top: 19px;
          box-shadow: var(--shadow-sm);
        }
        
        .bg-gray { background-color: var(--info); }
        .bg-blue { background-color: #409eff; }
        .bg-green { background-color: var(--success); }
        .bg-orange { background-color: var(--warning); }
        .bg-red { background-color: var(--danger); }
        .bg-purple { background-color: #b37feb; }

        .node-line {
          position: absolute;
          top: 31px;
          bottom: 0;
          width: 2px;
          background-color: var(--border-color);
          z-index: 1;
        }
        .timeline-node:last-child .node-line {
          display: none; /* Hide line for the last node */
        }

        .node-content {
          padding: 15px 20px;
          background-color: var(--light-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          margin-bottom: 15px;
          transition: var(--transition-fast);
        }
        .node-content:hover {
          background-color: white;
          box-shadow: var(--shadow-sm);
        }

        .node-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .node-user {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-dark);
          font-weight: 600;
        }

        .node-badge-type {
          font-size: 9px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .node-badge-type.login { background-color: #ecf5ff; color: #409eff; }
        .node-badge-type.tambah { background-color: var(--success-light); color: var(--success); }
        .node-badge-type.edit { background-color: var(--warning-light); color: var(--warning); }
        .node-badge-type.hapus { background-color: var(--danger-light); color: var(--danger); }
        .node-badge-type.refill { background-color: #f9f0ff; color: #722ed1; }
        .node-badge-type.system { background-color: var(--info-light); color: var(--info); }

        .node-action {
          font-size: 13px;
          color: var(--text-dark);
          margin-bottom: 4px;
        }

        .node-id {
          font-size: 9px;
          color: var(--text-muted);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .timeline-node {
            grid-template-columns: 20px 1fr;
          }
          .node-date {
            grid-row: 1;
            grid-column: 2;
            padding: 5px 0 0 10px;
          }
          .node-indicator {
            grid-column: 1;
            grid-row: 1 / span 2;
          }
          .node-dot {
            margin-top: 10px;
          }
          .node-line {
            top: 22px;
          }
          .node-content {
            grid-row: 2;
            grid-column: 2;
            margin-left: 10px;
          }
        }
      `}</style>
    </div>
  );
}
