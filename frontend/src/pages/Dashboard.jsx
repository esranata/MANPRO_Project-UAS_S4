import React, { useState, useEffect } from 'react';
import { Truck, Warehouse, Users, MapPin, ClipboardList, RefreshCw, ChevronRight, Map } from 'lucide-react';
import { api } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    suppliers: 0,
    warehouses: 0,
    distributors: 0,
    regions: 0,
    pendingRefills: 0,
    totalGoods: 0
  });
  const [regionChartData, setRegionChartData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentData, setRecentData] = useState([]);
  
  // Map Data States
  const [mapNodes, setMapNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mapFilter, setMapFilter] = useState('all'); // 'all', 'warehouse', 'supplier'
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Helper to map text location to SVG coordinates (x: 0-600, y: 0-300)
  const getCoordinates = (locationText, id, isWarehouse) => {
    const text = locationText.toLowerCase();
    
    // Preset coordinates on Java Island representation
    if (text.includes('jakarta') || text.includes('sunter')) {
      return { x: 120, y: 140, city: 'Jakarta' };
    }
    if (text.includes('bekasi') || text.includes('cikarang')) {
      return { x: 180, y: 150, city: 'Cikarang/Bekasi' };
    }
    if (text.includes('semarang') || text.includes('candi')) {
      return { x: 340, y: 165, city: 'Semarang' };
    }
    if (text.includes('surabaya') || text.includes('margomulyo')) {
      return { x: 480, y: 180, city: 'Surabaya' };
    }
    
    // Fallback pseudo-random coordinates within map bounds to prevent overlapping
    const seed = id.toString().charCodeAt(0) || 1;
    return {
      x: 100 + (seed % 4) * 110 + (isWarehouse ? 20 : -20),
      y: 130 + (seed % 3) * 30,
      city: 'Lokasi Hub'
    };
  };

  const fetchData = async () => {
    try {
      const [suppliersRes, warehousesRes, distributorsRes, regionsRes, logsRes, goodsRes] = await Promise.all([
        api.get('/suppliers', { limit: 100 }),
        api.get('/warehouses'),
        api.get('/distributors'),
        api.get('/regions'),
        api.get('/logs'),
        api.get('/goods')
      ]);

      // Calculate stats
      const suppliersList = suppliersRes.data || [];
      const warehousesList = warehousesRes || [];
      const supCount = suppliersRes.pagination?.totalItems || suppliersList.length || 0;
      const whCount = warehousesList.length || 0;
      const distCount = distributorsRes.length || 0;
      const regCount = regionsRes.length || 0;
      const pendingCount = goodsRes.filter(g => g.status === 'Pending').length;

      setStats({
        suppliers: supCount,
        warehouses: whCount,
        distributors: distCount,
        regions: regCount,
        pendingRefills: pendingCount,
        totalGoods: goodsRes.length
      });

      setRegionChartData(regionsRes);
      setRecentLogs((logsRes || []).slice(0, 5));

      // Construct Map Nodes from active Warehouses & Suppliers
      const nodes = [];
      
      // Add Warehouses
      warehousesList.forEach(w => {
        const coords = getCoordinates(w.location, w.id, true);
        nodes.push({
          id: w.id,
          name: w.name,
          type: 'warehouse',
          location: w.location,
          city: coords.city,
          x: coords.x,
          y: coords.y,
          status: w.status,
          detail: `Kapasitas: ${w.capacity.toLocaleString()} Unit`
        });
      });

      // Add Suppliers
      suppliersList.forEach(s => {
        const coords = getCoordinates(s.address, s.id, false);
        nodes.push({
          id: `SPL-${s.id}`,
          name: s.name,
          type: 'supplier',
          location: s.address,
          city: coords.city,
          x: coords.x,
          y: coords.y,
          status: s.status,
          detail: `Kontak: ${s.phone} | ${s.email}`
        });
      });

      setMapNodes(nodes);
      
      // Default select the first warehouse node to showcase details on load
      if (nodes.length > 0) {
        setSelectedNode(nodes.find(n => n.type === 'warehouse') || nodes[0]);
      }

      // Construct recent added data list
      const combined = [];
      suppliersList.slice(0, 2).forEach(s => {
        combined.push({ type: 'Supplier', name: s.name, desc: s.email, time: 'Baru-baru ini' });
      });
      warehousesList.slice(0, 2).forEach(w => {
        combined.push({ type: 'Gudang', name: w.name, desc: w.location, time: 'Baru-baru ini' });
      });
      (distributorsRes || []).slice(0, 2).forEach(d => {
        combined.push({ type: 'Distributor', name: d.name, desc: d.phone, time: 'Baru-baru ini' });
      });
      setRecentData(combined.slice(0, 5));

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter map nodes based on selection
  const filteredNodes = mapNodes.filter(node => {
    if (mapFilter === 'all') return true;
    return node.type === mapFilter;
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Memuat data dasbor...</p>
      </div>
    );
  }

  const maxDistributors = regionChartData.length > 0 
    ? Math.max(...regionChartData.map(r => r.distributorCount || 0), 1) 
    : 1;

  return (
    <div className="dashboard-wrapper">
      {/* Dashboard Top bar */}
      <div className="page-header">
        <div className="page-title">
          <h1>Ringkasan Data Logistik</h1>
          <p>Pemantauan aktivitas operasional, gudang, wilayah distributor, dan alur refill barang.</p>
        </div>
        <button 
          className={`btn btn-outline btn-refresh ${refreshing ? 'loading' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid-cols-4">
        {/* Suppliers Card */}
        <div className="stat-card">
          <div className="stat-icon-wrapper color-peach">
            <Truck size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Supplier</p>
            <h3 className="stat-value">{stats.suppliers}</h3>
            <span className="stat-subtext">Penyedia Rantai Pasok</span>
          </div>
        </div>

        {/* Warehouses Card */}
        <div className="stat-card">
          <div className="stat-icon-wrapper color-pink">
            <Warehouse size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Gudang</p>
            <h3 className="stat-value">{stats.warehouses}</h3>
            <span className="stat-subtext">Pusat Penyimpanan</span>
          </div>
        </div>

        {/* Distributors Card */}
        <div className="stat-card">
          <div className="stat-icon-wrapper color-cream">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Distributor</p>
            <h3 className="stat-value">{stats.distributors}</h3>
            <span className="stat-subtext">Rekan Penyaluran</span>
          </div>
        </div>

        {/* Regions Card */}
        <div className="stat-card">
          <div className="stat-icon-wrapper color-charcoal">
            <MapPin size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Wilayah</p>
            <h3 className="stat-value">{stats.regions}</h3>
            <span className="stat-subtext">Cakupan Distribusi</span>
          </div>
        </div>
      </div>

      {/* ==================== INTERACTIVE LOCATION MAP WIDGET ==================== */}
      <div className="card map-widget-card" style={{ marginBottom: '25px' }}>
        <div className="map-widget-header">
          <div className="map-title-block">
            <Map className="map-header-icon" size={20} />
            <div>
              <h3>Peta Lokasi Wilayah (Gudang & Supplier)</h3>
              <p>Visualisasi geografis sebaran pusat penyimpanan (gudang) dan penyedia pasokan (supplier) di pulau Jawa.</p>
            </div>
          </div>
          <div className="map-filter-buttons">
            <button 
              className={`btn btn-sm ${mapFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMapFilter('all')}
            >
              Semua
            </button>
            <button 
              className={`btn btn-sm ${mapFilter === 'warehouse' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMapFilter('warehouse')}
            >
              Gudang
            </button>
            <button 
              className={`btn btn-sm ${mapFilter === 'supplier' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMapFilter('supplier')}
            >
              Supplier
            </button>
          </div>
        </div>

        <div className="map-layout">
          {/* Left panel: Interactive SVG Map */}
          <div className="map-canvas-container">
            <svg viewBox="0 0 600 280" className="logistic-map-svg">
              {/* Java Island Grid/Structure Blueprint Design */}
              {/* Main outline path representing pseudo Java Island shape */}
              <path 
                d="M 50,150 Q 70,120 130,125 T 190,135 T 270,140 T 360,150 T 430,160 T 520,165 T 570,190 Q 550,220 480,205 T 390,195 T 310,185 T 220,175 T 140,165 T 50,150 Z" 
                fill="#FAF6F5" 
                stroke="#E2DCDA" 
                strokeWidth="2" 
                strokeDasharray="4 2"
              />
              
              {/* Regional connection tracks */}
              <path 
                d="M 120,140 L 180,150 L 340,165 L 480,180" 
                fill="none" 
                stroke="var(--secondary-1)" 
                strokeWidth="1.5" 
                strokeDasharray="5 5" 
              />
              
              {/* Cities Labels */}
              <text x="120" y="125" className="map-city-label">Jakarta</text>
              <text x="180" y="170" className="map-city-label">Bekasi</text>
              <text x="340" y="150" className="map-city-label">Semarang</text>
              <text x="480" y="200" className="map-city-label">Surabaya</text>

              {/* Render dynamic markers */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const markerColor = node.type === 'warehouse' ? 'var(--primary-color)' : 'var(--secondary-1)';
                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    className="map-marker-group"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Pulsating glow animation ring */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="12" 
                      fill={markerColor} 
                      opacity={isSelected ? "0.4" : "0.15"} 
                      className="pulsating-ring"
                    />
                    {/* Inner core dot */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="6" 
                      fill={isSelected ? '#2D2928' : markerColor} 
                      stroke={isSelected ? markerColor : '#fff'}
                      strokeWidth="2"
                    />
                    {/* Mini Icon indicator */}
                    <text 
                      x="0" 
                      y="-12" 
                      textAnchor="middle" 
                      className="marker-symbol"
                    >
                      {node.type === 'warehouse' ? '🏢' : '🚚'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right panel: Glassmorphic Active Node details */}
          <div className="map-details-sidebar">
            {selectedNode ? (
              <div className="node-detail-card">
                <span className={`node-type-label type-${selectedNode.type}`}>
                  {selectedNode.type === 'warehouse' ? 'Gudang Penyimpanan' : 'Supplier Pasokan'}
                </span>
                
                <h4 className="node-name">{selectedNode.name}</h4>
                <p className="node-id-tag">ID: {selectedNode.id}</p>
                
                <div className="node-detail-info">
                  <div className="info-row">
                    <span className="info-lbl">Wilayah Kota:</span>
                    <span className="info-val">📍 {selectedNode.city}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-lbl">Alamat Lengkap:</span>
                    <span className="info-val">{selectedNode.location}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-lbl">Status Unit:</span>
                    <span className={`badge ${selectedNode.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {selectedNode.status === 'Active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="info-row detail-accent-row">
                    <span className="info-lbl">Detail Operasional:</span>
                    <span className="info-val">{selectedNode.detail}</span>
                  </div>
                </div>

                <div className="node-card-footer-tip">
                  <span className="tip-icon">✓</span>
                  <span>Koneksi hub distribusi terverifikasi aman.</span>
                </div>
              </div>
            ) : (
              <div className="no-node-selected">
                <MapPin size={24} />
                <p>Klik salah satu marker di peta untuk menampilkan detail lokasi gudang atau supplier.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Panel Widgets */}
      <div className="grid-cols-3">
        {/* Left Side: SVG Chart (occupies 2 columns) */}
        <div className="card dashboard-chart-card col-span-2">
          <div className="widget-header">
            <h3>Grafik Jumlah Distributor per Wilayah</h3>
            <p>Visualisasi sebaran distributor aktif berdasarkan wilayah operasional.</p>
          </div>

          <div className="chart-container">
            {regionChartData.length === 0 ? (
              <div className="no-data-msg">Tidak ada data wilayah tersedia.</div>
            ) : (
              <div className="custom-bar-chart">
                {regionChartData.map((reg, index) => {
                  const count = reg.distributorCount || 0;
                  const percentage = (count / maxDistributors) * 100;
                  return (
                    <div className="chart-row" key={reg.id}>
                      <div className="chart-row-label">
                        <span className="region-code">{reg.id}</span>
                        <span className="region-name">{reg.name}</span>
                      </div>
                      <div className="chart-row-bar-wrapper">
                        <div 
                          className="chart-row-bar" 
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        >
                          <span className="bar-value-label">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Action & Active Refill info */}
        <div className="card refill-summary-card">
          <div className="widget-header">
            <h3>Alur Refill Barang</h3>
            <p>Status antrean penambahan stok.</p>
          </div>

          <div className="refill-status-box">
            <div className="refill-metric pending">
              <span className="metric-num">{stats.pendingRefills}</span>
              <span className="metric-label">Menunggu Persetujuan Admin</span>
            </div>
            <div className="refill-metric accepted">
              <span className="metric-num">{stats.totalGoods - stats.pendingRefills}</span>
              <span className="metric-label">Barang Aktif / Refilled</span>
            </div>
          </div>

          <div className="refill-flow-guide">
            <h4>Panduan Alur:</h4>
            <ol className="flow-list">
              <li><strong>Staff:</strong> Input barang masuk kosong.</li>
              <li><strong>Admin:</strong> Terima/Accept barang masuk.</li>
              <li><strong>Manager:</strong> Monitor stok terisi sebelum penyaluran.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="grid-cols-2">
        {/* Bottom Left: Recent Activities */}
        <div className="card">
          <div className="widget-header widget-header-icon">
            <ClipboardList className="header-icon" size={18} />
            <div>
              <h3>Aktivitas Terbaru</h3>
              <p>Log audit riwayat aktivitas user operasional di sistem.</p>
            </div>
          </div>

          <div className="dashboard-list">
            {recentLogs.length === 0 ? (
              <p className="no-data-msg">Belum ada aktivitas tercatat.</p>
            ) : (
              recentLogs.map((log) => (
                <div className="list-item log-item" key={log.id}>
                  <div className="log-avatar">
                    {log.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="list-item-content">
                    <p className="log-action"><strong>{log.userName}</strong> {log.action}</p>
                    <span className="log-time">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Right: New Added Data */}
        <div className="card">
          <div className="widget-header">
            <h3>Data Master Terbaru</h3>
            <p>Supplier, Gudang, & Distributor yang baru didaftarkan.</p>
          </div>

          <div className="dashboard-list">
            {recentData.length === 0 ? (
              <p className="no-data-msg">Belum ada data master terdaftar.</p>
            ) : (
              recentData.map((data, idx) => (
                <div className="list-item" key={idx}>
                  <div className={`data-badge-type type-${data.type.toLowerCase()}`}>
                    {data.type}
                  </div>
                  <div className="list-item-content">
                    <h4>{data.name}</h4>
                    <p className="data-desc">{data.desc}</p>
                  </div>
                  <ChevronRight size={16} className="item-arrow" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: var(--text-muted);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .btn-refresh {
          background-color: white;
        }
        .btn-refresh.loading svg {
          animation: spin 1s linear infinite;
        }

        /* Stat Card styles */
        .stat-card {
          background: var(--card-bg);
          border-radius: var(--border-radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-color);
          transition: var(--transition);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .stat-icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .color-peach {
          background-color: var(--primary-light);
          color: var(--primary-hover);
        }
        .color-pink {
          background-color: #fef0f0;
          color: var(--danger);
        }
        .color-cream {
          background-color: var(--secondary-2);
          color: #d88f80;
        }
        .color-charcoal {
          background-color: #e8dedb;
          color: var(--text-dark);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-value {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-dark);
          line-height: 1.2;
          margin: 2px 0;
        }
        .stat-subtext {
          font-size: 10px;
          color: var(--text-muted);
        }

        /* Map Widget Styling */
        .map-widget-card {
          padding: 24px;
        }
        .map-widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .map-title-block {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .map-header-icon {
          color: var(--primary-color);
          margin-top: 3px;
        }
        .map-title-block h3 {
          font-size: 16px;
          font-weight: 600;
        }
        .map-title-block p {
          font-size: 12px;
          color: var(--text-muted);
        }
        .map-filter-buttons {
          display: flex;
          gap: 8px;
        }

        .map-layout {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 20px;
          background-color: var(--light-bg);
          border-radius: var(--border-radius);
          border: 1px solid var(--border-color);
          overflow: hidden;
          padding: 15px;
        }

        .map-canvas-container {
          background-color: #ffffff;
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
          position: relative;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logistic-map-svg {
          width: 100%;
          max-height: 280px;
        }

        .map-city-label {
          font-size: 10px;
          font-weight: 600;
          fill: var(--text-muted);
        }

        .map-marker-group {
          cursor: pointer;
        }
        .marker-symbol {
          font-size: 14px;
          pointer-events: none;
        }

        .pulsating-ring {
          animation: pulse 2s infinite;
          transform-origin: center;
        }
        @keyframes pulse {
          0% {
            r: 6px;
            opacity: 0.8;
          }
          100% {
            r: 22px;
            opacity: 0;
          }
        }

        /* Map Details Sidebar */
        .map-details-sidebar {
          background-color: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(5px);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .node-detail-card {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        .node-type-label {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .node-type-label.type-warehouse {
          background-color: var(--primary-light);
          color: var(--primary-hover);
        }
        .node-type-label.type-supplier {
          background-color: #fef0f0;
          color: var(--danger);
        }

        .node-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-dark);
          line-height: 1.3;
        }
        .node-id-tag {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 15px;
        }

        .node-detail-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 15px;
        }
        .node-detail-info .info-row {
          display: flex;
          flex-direction: column;
          font-size: 12.5px;
        }
        .node-detail-info .info-lbl {
          color: var(--text-muted);
          font-weight: 500;
          font-size: 11px;
          margin-bottom: 2px;
        }
        .node-detail-info .info-val {
          color: var(--text-dark);
          font-weight: 600;
        }
        
        .detail-accent-row {
          background-color: #ffffff;
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid var(--primary-color);
        }

        .node-card-footer-tip {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--success);
          font-weight: 500;
          border-top: 1px dashed var(--border-color);
          padding-top: 12px;
          margin-top: 5px;
        }
        .tip-icon {
          flex-shrink: 0;
        }

        .no-node-selected {
          text-align: center;
          padding: 30px 10px;
          color: var(--text-muted);
        }
        .no-node-selected p {
          font-size: 12px;
          margin-top: 8px;
        }

        /* Chart card styles */
        .col-span-2 {
          grid-column: span 2;
        }

        .widget-header {
          margin-bottom: 20px;
        }
        .widget-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-dark);
        }
        .widget-header p {
          color: var(--text-muted);
          font-size: 12px;
        }

        .widget-header-icon {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .header-icon {
          color: var(--primary-color);
          margin-top: 3px;
        }

        .chart-container {
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .custom-bar-chart {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .chart-row {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .chart-row-label {
          width: 140px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .region-code {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-dark);
        }
        .region-name {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chart-row-bar-wrapper {
          flex-grow: 1;
          height: 24px;
          background-color: var(--light-bg);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }

        .chart-row-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--secondary-1) 0%, var(--primary-color) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          transition: width 1s ease-out;
        }

        .bar-value-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-dark);
        }

        /* Refill details widget */
        .refill-status-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .refill-metric {
          padding: 15px;
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .refill-metric.pending {
          background-color: var(--warning-light);
          border: 1px solid rgba(230, 162, 60, 0.15);
        }
        .refill-metric.accepted {
          background-color: var(--success-light);
          border: 1px solid rgba(103, 194, 58, 0.15);
        }

        .metric-num {
          font-size: 24px;
          font-weight: 700;
        }
        .refill-metric.pending .metric-num {
          color: var(--warning);
        }
        .refill-metric.accepted .metric-num {
          color: var(--success);
        }

        .metric-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-dark);
        }

        .refill-flow-guide {
          background-color: var(--light-bg);
          padding: 15px;
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
        }
        .refill-flow-guide h4 {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .flow-list {
          padding-left: 18px;
          font-size: 11px;
          color: var(--text-muted);
        }
        .flow-list li {
          margin-bottom: 4px;
        }

        /* Lists design */
        .dashboard-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .list-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .list-item-content {
          flex-grow: 1;
        }
        .list-item-content h4 {
          font-size: 13px;
          font-weight: 600;
        }
        .data-desc {
          font-size: 11px;
          color: var(--text-muted);
        }

        .data-badge-type {
          font-size: 9px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          width: 76px;
          text-align: center;
        }
        .type-supplier {
          background-color: var(--primary-light);
          color: var(--primary-hover);
        }
        .type-gudang {
          background-color: #fef0f0;
          color: var(--danger);
        }
        .type-distributor {
          background-color: var(--secondary-2);
          color: #d88f80;
        }

        .item-arrow {
          color: var(--text-muted-light);
        }

        /* Log items specific */
        .log-item {
          border-bottom: 1px solid #FAF6F5;
        }
        .log-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--light-bg);
          color: var(--text-dark);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          flex-shrink: 0;
        }
        .log-action {
          font-size: 12px;
          color: var(--text-dark);
        }
        .log-time {
          font-size: 10px;
          color: var(--text-muted);
        }

        .no-data-msg {
          text-align: center;
          padding: 20px;
          color: var(--text-muted);
          font-size: 12px;
        }

        /* Map layout responsive */
        @media (max-width: 1024px) {
          .map-layout {
            grid-template-columns: 1fr;
          }
          .col-span-2 {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
