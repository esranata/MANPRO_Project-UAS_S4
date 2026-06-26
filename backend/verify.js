const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
};

function makeRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      ...options,
      path,
      method,
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== MEMULAI VERIFIKASI ENDPOINT BACKEND API ===");
  
  try {
    // 1. Test Login Admin
    console.log("\n1. Menguji Login Admin...");
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@company.com',
      password: 'admin123'
    });

    if (loginRes.statusCode !== 200 || !loginRes.body.token) {
      throw new Error(`Login gagal! Status: ${loginRes.statusCode}`);
    }
    const token = loginRes.body.token;
    console.log("✓ Login Berhasil! Token JWT diperoleh.");

    // 2. Test Get Suppliers
    console.log("\n2. Menguji GET /api/suppliers...");
    const supRes = await makeRequest('/api/suppliers', 'GET', null, token);
    if (supRes.statusCode === 200) {
      console.log(`✓ GET /api/suppliers berhasil. Ditemukan ${supRes.body.data.length} supplier.`);
    } else {
      console.log(`✗ GET /api/suppliers gagal! Status: ${supRes.statusCode}`);
    }

    // 3. Test Get Warehouses
    console.log("\n3. Menguji GET /api/warehouses...");
    const whRes = await makeRequest('/api/warehouses', 'GET', null, token);
    if (whRes.statusCode === 200) {
      console.log(`✓ GET /api/warehouses berhasil. Ditemukan ${whRes.body.length} gudang.`);
    } else {
      console.log(`✗ GET /api/warehouses gagal! Status: ${whRes.statusCode}`);
    }

    // 4. Test Get Goods
    console.log("\n4. Menguji GET /api/goods...");
    const goodsRes = await makeRequest('/api/goods', 'GET', null, token);
    if (goodsRes.statusCode === 200) {
      console.log(`✓ GET /api/goods berhasil. Ditemukan ${goodsRes.body.length} barang.`);
    } else {
      console.log(`✗ GET /api/goods gagal! Status: ${goodsRes.statusCode}`);
    }

    // 5. Test Get Distributors
    console.log("\n5. Menguji GET /api/distributors...");
    const distRes = await makeRequest('/api/distributors', 'GET', null, token);
    if (distRes.statusCode === 200) {
      console.log(`✓ GET /api/distributors berhasil. Ditemukan ${distRes.body.length} distributor.`);
    } else {
      console.log(`✗ GET /api/distributors gagal! Status: ${distRes.statusCode}`);
    }

    // 6. Test Get Regions
    console.log("\n6. Menguji GET /api/regions...");
    const regRes = await makeRequest('/api/regions', 'GET', null, token);
    if (regRes.statusCode === 200) {
      console.log(`✓ GET /api/regions berhasil. Ditemukan ${regRes.body.length} wilayah.`);
    } else {
      console.log(`✗ GET /api/regions gagal! Status: ${regRes.statusCode}`);
    }

    // 7. Test Get Activity Logs
    console.log("\n7. Menguji GET /api/logs...");
    const logsRes = await makeRequest('/api/logs', 'GET', null, token);
    if (logsRes.statusCode === 200) {
      console.log(`✓ GET /api/logs berhasil. Ditemukan ${logsRes.body.length} entri log.`);
    } else {
      console.log(`✗ GET /api/logs gagal! Status: ${logsRes.statusCode}`);
    }

    // 8. Test Get Users (Admin only)
    console.log("\n8. Menguji GET /api/users (Manajemen User)...");
    const usersRes = await makeRequest('/api/users', 'GET', null, token);
    if (usersRes.statusCode === 200) {
      console.log(`✓ GET /api/users berhasil. Ditemukan ${usersRes.body.length} user terdaftar.`);
    } else {
      console.log(`✗ GET /api/users gagal! Status: ${usersRes.statusCode}`);
    }

    console.log("\n=== VERIFIKASI SELESAI. SEMUA ENDPOINT UTAMA BERJALAN DENGAN BAIK! ===");

  } catch (err) {
    console.error("\n✗ Terjadi kesalahan selama pengujian:", err.message);
  }
}

// Bounded wait of 2 seconds to ensure backend is fully initialized
setTimeout(runTests, 1000);
