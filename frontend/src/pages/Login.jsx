import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Silakan masukkan email dan password!");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      api.setToken(res.token);
      api.setUser(res.user);
      onLoginSuccess(res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to quickly fill credentials for review testing
  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div className="login-wrapper">
      {/* Background Warehouse Graphic Overlay */}
      <div className="bg-decor-circle circle-1" />
      <div className="bg-decor-circle circle-2" />
      
      <div className="login-card-container">
        {/* Left Side: Graphic & Brand info */}
        <div className="login-brand-side">
          <div className="brand-overlay" />
          <div className="brand-content">
            <span className="brand-icon">📦</span>
            <h1>LOGISTIC HUB</h1>
            <p>Sistem Pengelolaan Master Data Supplier, Gudang, Wilayah, & Alur Refill Barang Terintegrasi.</p>
            
            {/* SVG Warehouse Schematic */}
            <svg className="warehouse-svg" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 200 H350" stroke="#ffb692" strokeWidth="4" strokeLinecap="round" />
              {/* Warehouse structure */}
              <path d="M80 200 V100 L200 40 L320 100 V200" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
              {/* Doors */}
              <rect x="110" y="140" width="50" height="60" rx="3" fill="#ffb692" fillOpacity="0.2" stroke="#ffb692" strokeWidth="2" />
              <rect x="240" y="140" width="50" height="60" rx="3" fill="#ffb692" fillOpacity="0.2" stroke="#ffb692" strokeWidth="2" />
              {/* Shelves inside warehouse schematic */}
              <path d="M120 160 H150 M120 180 H150 M250 160 H280 M250 180 H280" stroke="#fff" strokeWidth="2" />
              {/* Distribution truck moving */}
              <rect x="300" y="160" width="40" height="25" rx="3" fill="#e7bbc4" />
              <circle cx="310" cy="190" r="5" fill="#2D2928" />
              <circle cx="330" cy="190" r="5" fill="#2D2928" />
              <path d="M340 165 H348 L355 175 V185 H340 V165 Z" fill="#FADCD6" />
            </svg>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-form-side">
          <div className="form-header">
            <h2>Selamat Datang</h2>
            <p>Silakan masuk ke akun Anda</p>
          </div>

          {error && <div className="login-error-alert">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email / Username</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <KeyRound className="input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control" 
                  placeholder="Masukkan password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark" />
                <span className="checkbox-label">Ingat saya</span>
              </label>
              <a href="#forgot" className="forgot-link" onClick={() => alert('Fitur ini dinonaktifkan dalam mode demo. Silakan gunakan Quick Fill di bawah.')}>
                Lupa Password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              <LogIn size={18} />
              <span>{loading ? 'Masuk...' : 'Masuk ke Portal'}</span>
            </button>
          </form>

          {/* Quick Login Seeder (Helps Operational Testing) */}
          <div className="demo-seeder">
            <h4>Quick Fill Demo Akun:</h4>
            <div className="demo-buttons">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('admin@company.com', 'admin123')}
              >
                Admin
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('staff@company.com', 'staff123')}
              >
                Staff
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickFill('manager@company.com', 'manager123')}
              >
                Manager
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 10% 20%, #FAF6F5 0%, #FADCD6 100%);
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        /* Ambient glowing background circles */
        .bg-decor-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 1;
        }
        .circle-1 {
          width: 350px;
          height: 350px;
          background-color: var(--primary-color);
          opacity: 0.25;
          top: -50px;
          left: -50px;
        }
        .circle-2 {
          width: 450px;
          height: 450px;
          background-color: var(--secondary-1);
          opacity: 0.25;
          bottom: -100px;
          right: -100px;
        }

        .login-card-container {
          width: 100%;
          max-width: 900px;
          min-height: 520px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          overflow: hidden;
          z-index: 10;
          animation: cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Left Side */
        .login-brand-side {
          background-color: var(--dark-bg);
          position: relative;
          padding: 40px;
          display: flex;
          align-items: center;
          color: white;
        }

        .brand-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 182, 146, 0.15) 0%, rgba(45, 41, 40, 0) 100%);
          pointer-events: none;
        }

        .brand-content {
          position: relative;
          z-index: 5;
          width: 100%;
        }

        .brand-icon {
          font-size: 45px;
          display: block;
          margin-bottom: 15px;
        }

        .brand-content h1 {
          color: var(--primary-color);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 15px;
        }

        .brand-content p {
          color: #d8cecc;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 25px;
        }

        .warehouse-svg {
          width: 100%;
          max-height: 180px;
          opacity: 0.85;
        }

        /* Right Side */
        .login-form-side {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .form-header {
          margin-bottom: 30px;
        }

        .form-header h2 {
          font-size: 24px;
          color: var(--text-dark);
          font-weight: 700;
        }

        .form-header p {
          color: var(--text-muted);
          font-size: 13px;
        }

        .login-error-alert {
          background-color: var(--danger-light);
          color: var(--danger);
          padding: 12px;
          border-radius: var(--border-radius-sm);
          font-size: 12px;
          margin-bottom: 20px;
          border-left: 4px solid var(--danger);
        }

        .login-form {
          margin-bottom: 25px;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .input-with-icon .form-control {
          padding-left: 40px;
          padding-right: 40px;
          height: 44px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }
        .password-toggle:hover {
          color: var(--text-dark);
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          font-size: 12px;
        }

        /* Custom Checkbox */
        .checkbox-container {
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 24px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          position: absolute;
          left: 0;
          height: 16px;
          width: 16px;
          background-color: white;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          transition: var(--transition-fast);
        }

        .checkbox-container:hover input ~ .checkmark {
          border-color: var(--primary-color);
        }

        .checkbox-container input:checked ~ .checkmark {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }

        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }

        .checkbox-container .checkmark:after {
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid var(--dark-bg);
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-label {
          color: var(--text-dark);
          font-weight: 500;
        }

        .forgot-link {
          font-weight: 500;
          color: var(--text-muted);
        }
        .forgot-link:hover {
          color: var(--primary-hover);
        }

        .login-btn {
          width: 100%;
          height: 44px;
          font-weight: 600;
          font-size: 15px;
        }

        /* Demo quick fill */
        .demo-seeder {
          border-top: 1px dashed var(--border-color);
          padding-top: 18px;
        }

        .demo-seeder h4 {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .demo-buttons {
          display: flex;
          gap: 8px;
        }

        .demo-buttons .btn {
          padding: 6px 12px;
          font-size: 11px;
          background-color: var(--secondary-2);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
        }
        .demo-buttons .btn:hover {
          background-color: var(--secondary-1);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .login-card-container {
            grid-template-columns: 1fr;
          }
          .login-brand-side {
            display: none; /* Hide brand panel on mobile */
          }
          .login-form-side {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}
