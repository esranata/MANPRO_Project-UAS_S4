import React from 'react';
import { Menu, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuToggle, pageTitle, user }) {
  const navigate = useNavigate();

  // Get current date string formatted in Indonesian
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('id-ID', options);
  };

  return (
    <header className="navbar-container">
      {/* Left items: Menu Toggle & Title */}
      <div className="navbar-left">
        <button className="menu-toggle-btn" onClick={onMenuToggle} aria-label="Toggle Sidebar">
          <Menu size={20} />
        </button>
        <div className="navbar-title">
          <h2>{pageTitle}</h2>
        </div>
      </div>

      {/* Right items: Date, Profile Card */}
      <div className="navbar-right">
        <div className="navbar-date">
          <Calendar size={15} />
          <span>{getFormattedDate()}</span>
        </div>

        <div className="navbar-profile-card" onClick={() => navigate('/profile')}>
          <div className="navbar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="navbar-user-info">
            <h5>{user?.name}</h5>
            <p>{user?.role === 'Staff' ? 'Staff Operasional' : user?.role}</p>
          </div>
        </div>
      </div>

      <style>{`
        .navbar-container {
          position: fixed;
          top: 0;
          right: 0;
          left: 0;
          height: var(--navbar-height);
          background-color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          z-index: 900;
          margin-left: var(--sidebar-width);
          transition: var(--transition);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .menu-toggle-btn {
          display: none;
          background: transparent;
          color: var(--text-dark);
          padding: 8px;
          border-radius: var(--border-radius-sm);
          transition: var(--transition-fast);
        }

        .menu-toggle-btn:hover {
          background-color: var(--primary-light);
          color: var(--primary-hover);
        }

        .navbar-title h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-dark);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .navbar-date {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 12px;
          background-color: var(--light-bg);
          padding: 6px 12px;
          border-radius: 50px;
          border: 1px solid var(--border-color);
        }

        .navbar-profile-card {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 8px;
          transition: var(--transition-fast);
        }

        .navbar-profile-card:hover {
          background-color: var(--primary-light);
        }

        .navbar-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--secondary-1), var(--primary-color));
          color: var(--text-dark);
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navbar-user-info {
          text-align: left;
        }

        .navbar-user-info h5 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
        }

        .navbar-user-info p {
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .navbar-container {
            margin-left: 0;
            padding: 0 15px;
          }

          .menu-toggle-btn {
            display: flex;
          }

          .navbar-date {
            display: none; /* Hide date on small screens */
          }
        }
      `}</style>
    </header>
  );
}
