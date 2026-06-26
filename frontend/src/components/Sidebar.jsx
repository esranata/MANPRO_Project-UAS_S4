import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Warehouse, 
  Package, 
  Users, 
  MapPin, 
  UserCheck, 
  ClipboardList, 
  User, 
  LogOut,
  X
} from 'lucide-react';
import { api } from '../utils/api';

export default function Sidebar({ isOpen, onClose, user }) {
  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      api.logout();
    }
  };

  // Determine which links to show based on user role
  const isSelfAdmin = user?.role === 'Admin';

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Staff', 'Manager'] },
    { path: '/suppliers', label: 'Supplier', icon: Truck, roles: ['Admin', 'Staff', 'Manager'] },
    { path: '/warehouses', label: 'Gudang', icon: Warehouse, roles: ['Admin', 'Staff', 'Manager'] },
    { path: '/goods', label: 'Barang & Refill', icon: Package, roles: ['Admin', 'Staff', 'Manager'] },
    { path: '/distributors', label: 'Distributor', icon: Users, roles: ['Admin', 'Staff', 'Manager'] },
    { path: '/regions', label: 'Wilayah', icon: MapPin, roles: ['Admin', 'Staff', 'Manager'] },
    { path: '/users', label: 'Manajemen User', icon: UserCheck, roles: ['Admin'] },
    { path: '/logs', label: 'Activity Log', icon: ClipboardList, roles: ['Admin', 'Staff', 'Manager'] },
    { path: '/profile', label: 'Profil Saya', icon: User, roles: ['Admin', 'Staff', 'Manager'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">📦</span>
            <div className="logo-text">
              <h3>LOGISTIC HUB</h3>
              <p>Master Data Portal</p>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          <ul>
            {filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Icon size={18} className="link-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Widget */}
        <div className="sidebar-profile">
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <h4>{user?.name}</h4>
              <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
                {user?.role === 'Staff' ? 'Staff Operasional' : user?.role}
              </span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Keluar dari Akun">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <style>{`
        /* Sidebar Styling */
        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(45, 41, 40, 0.4);
          backdrop-filter: blur(3px);
          z-index: 1000;
        }

        .sidebar-container {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background-color: var(--dark-bg);
          color: var(--text-light);
          display: flex;
          flex-direction: column;
          z-index: 1001;
          transition: var(--transition);
          box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
        }

        .sidebar-header {
          height: var(--navbar-height);
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #3e3837;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-icon {
          font-size: 24px;
        }

        .logo-text h3 {
          color: var(--primary-color);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.5px;
          line-height: 1.2;
        }

        .logo-text p {
          font-size: 10px;
          color: var(--text-muted-light);
        }

        .sidebar-close-btn {
          display: none;
          background: transparent;
          color: white;
          padding: 5px;
        }

        .sidebar-nav {
          flex-grow: 1;
          padding: 20px 12px;
          overflow-y: auto;
        }

        .sidebar-nav ul {
          list-style: none;
        }

        .sidebar-nav li {
          margin-bottom: 6px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--border-radius-sm);
          color: #d8cecc;
          font-weight: 500;
          transition: var(--transition-fast);
        }

        .sidebar-link:hover {
          color: white;
          background-color: rgba(255, 255, 255, 0.05);
        }

        .sidebar-link.active {
          background-color: var(--primary-color);
          color: var(--dark-bg);
          font-weight: 600;
        }

        .link-icon {
          flex-shrink: 0;
        }

        .sidebar-profile {
          padding: 18px;
          border-top: 1px solid #3e3837;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #242120;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .profile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-1));
          color: var(--dark-bg);
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 15px;
        }

        .profile-details {
          overflow: hidden;
        }

        .profile-details h4 {
          color: white;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .role-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .role-admin {
          background-color: #f56c6c;
          color: white;
        }

        .role-staff {
          background-color: var(--primary-color);
          color: var(--dark-bg);
        }

        .role-manager {
          background-color: #e6a23c;
          color: white;
        }

        .logout-btn {
          background: transparent;
          color: var(--text-muted-light);
          padding: 8px;
          border-radius: 6px;
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
        }

        .logout-btn:hover {
          background: rgba(245, 108, 108, 0.1);
          color: #f56c6c;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .sidebar-overlay.active {
            display: block;
          }

          .sidebar-container {
            transform: translateX(-100%);
            width: 260px;
          }

          .sidebar-container.open {
            transform: translateX(0);
          }

          .sidebar-close-btn {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
