const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.json');

const defaultData = {
  users: [
    {
      id: 1,
      name: "Admin Utama",
      email: "admin@company.com",
      password: "", // Will be hashed below
      role: "Admin",
      status: "Active"
    },
    {
      id: 2,
      name: "Staff Operasional",
      email: "staff@company.com",
      password: "", // Will be hashed below
      role: "Staff",
      status: "Active"
    },
    {
      id: 3,
      name: "Manager Logistic",
      email: "manager@company.com",
      password: "", // Will be hashed below
      role: "Manager",
      status: "Active"
    }
  ],
  suppliers: [
    {
      id: 1,
      name: "PT Sumber Makmur",
      address: "Jl. Industri No. 12, Cikarang, Bekasi",
      phone: "021-8901234",
      email: "info@sumbermakmur.com",
      status: "Active"
    },
    {
      id: 2,
      name: "CV Global Niaga",
      address: "Kawasan Pergudangan Margomulyo Indah Blok C-5, Surabaya",
      phone: "031-7491029",
      email: "sales@globalniaga.co.id",
      status: "Active"
    },
    {
      id: 3,
      name: "PT Logistik Sentosa",
      address: "Jl. Gatot Subroto Kav. 55, Jakarta Selatan",
      phone: "021-5290123",
      email: "admin@logistiksentosa.com",
      status: "Inactive"
    }
  ],
  warehouses: [
    {
      id: "WH-001",
      name: "Gudang Utama Jakarta",
      location: "Sunter, Jakarta Utara",
      capacity: 5000,
      status: "Active"
    },
    {
      id: "WH-002",
      name: "Gudang Hub Surabaya",
      location: "Margomulyo, Surabaya",
      capacity: 3000,
      status: "Active"
    },
    {
      id: "WH-003",
      name: "Gudang Transit Semarang",
      location: "Kawasan Industri Candi, Semarang",
      capacity: 1500,
      status: "Inactive"
    }
  ],
  goods: [
    {
      id: 1,
      code: "BRG-001",
      name: "Semen Portland 50kg",
      warehouseId: "WH-001",
      stock: 120,
      incomingQty: 0,
      status: "Accepted" // Standard refilled state
    },
    {
      id: 2,
      code: "BRG-002",
      name: "Besi Beton 12mm",
      warehouseId: "WH-001",
      stock: 0, // Out of stock
      incomingQty: 450,
      status: "Pending" // Waiting for Admin to Accept
    },
    {
      id: 3,
      code: "BRG-003",
      name: "Cat Tembok Putih 20L",
      warehouseId: "WH-002",
      stock: 85,
      incomingQty: 50,
      status: "Pending" // Staff input incoming goods
    }
  ],
  distributors: [
    {
      id: "DST-001",
      name: "CV Sinar Abadi",
      regionId: "REG-DKI",
      phone: "0812-3456-7890",
      status: "Active"
    },
    {
      id: "DST-002",
      name: "PT Indo Distribusi",
      regionId: "REG-JABAR",
      phone: "0811-987-654",
      status: "Active"
    },
    {
      id: "DST-003",
      name: "CV Mandiri Jaya",
      regionId: "REG-JATIM",
      phone: "0822-4455-6677",
      status: "Active"
    }
  ],
  regions: [
    {
      id: "REG-DKI",
      name: "DKI Jakarta"
    },
    {
      id: "REG-JABAR",
      name: "Jawa Barat"
    },
    {
      id: "REG-JATENG",
      name: "Jawa Tengah"
    },
    {
      id: "REG-JATIM",
      name: "Jawa Timur"
    }
  ],
  logs: [
    {
      id: 1,
      timestamp: "2026-06-13T10:00:00.000Z",
      userId: 1,
      userName: "Admin Utama",
      action: "Inisialisasi sistem database"
    }
  ]
};

// Seed passwords synchronously if not set
defaultData.users[0].password = bcrypt.hashSync("admin123", 8);
defaultData.users[1].password = bcrypt.hashSync("staff123", 8);
defaultData.users[2].password = bcrypt.hashSync("manager123", 8);

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      writeDb(defaultData);
      return defaultData;
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return defaultData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Log action to the database
function addLog(userId, userName, action) {
  const db = readDb();
  const newLog = {
    id: db.logs.length > 0 ? Math.max(...db.logs.map(l => l.id)) + 1 : 1,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action
  };
  db.logs.unshift(newLog); // Put new logs at the beginning
  writeDb(db);
  return newLog;
}

module.exports = {
  readDb,
  writeDb,
  addLog
};
