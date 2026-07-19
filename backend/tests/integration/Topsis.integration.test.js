// backend/tests/integration/topsis.integration.test.js
//
// Integration Testing — dibuat untuk MENGGANTIKAN cuplikan di skripsi BAB 4.2.3
// yang endpoint-nya (POST /api/topsis/hitung, GET /api/material, dst) tidak
// sesuai dengan implementasi asli. File ini memakai endpoint & kredensial
// yang benar-benar ada di codebase, supaya hasil pengujian valid dan bisa
// dipertanggungjawabkan.
//
// PENTING: test ini butuh koneksi ke database (Clever Cloud), jalankan dari
// laptop dengan .env yang sudah mengarah ke database production/development
// yang berisi data (minimal 1 material dengan >= 2 vendor price aktif untuk
// test analisis TOPSIS berhasil).

const request = require("supertest");
const app = require("../../src/app");

describe("Integrasi API Endpoint TOPSIS & Material", () => {
  let managerToken;
  let technicianToken;
  let sampleMaterialId;

  beforeAll(async () => {
    // Login sebagai manager (akun seed asli: manager1 / Man@123)
    const managerRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "manager1", password: "Man@123" });
    managerToken = managerRes.body.token;

    // Login sebagai teknisi, dipakai untuk tes role-based rejection (403)
    const techRes = await request(app)
      .post("/api/auth/login")
      .send({ username: "teknisi1", password: "Tek@123" });
    technicianToken = techRes.body.token;

    // Cari material yang punya >= 2 vendor price aktif (syarat POST /api/topsis/analyze)
    const vpRes = await request(app)
      .get("/api/vendor-prices/all")
      .set("Authorization", `Bearer ${managerToken}`);

    const counts = {};
    (vpRes.body.data || []).forEach((vp) => {
      counts[vp.material_id] = (counts[vp.material_id] || 0) + 1;
    });
    sampleMaterialId = Object.keys(counts).find((id) => counts[id] >= 2);
  });

  test("Login manager mengembalikan token JWT", () => {
    expect(managerToken).toBeDefined();
  });

  test("POST /api/topsis/analyze mengembalikan status 200 untuk material dengan >=2 vendor", async () => {
    if (!sampleMaterialId) {
      console.warn(
        "⚠️  SKIP: belum ada material dengan >= 2 vendor price aktif. " +
          "Tambahkan data harga vendor lewat aplikasi dulu (minimal 2 vendor untuk 1 material) supaya test ini bisa jalan."
      );
      return;
    }
    const res = await request(app)
      .post("/api/topsis/analyze")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ material_id: sampleMaterialId, title: "Test Integrasi TOPSIS" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.results[0].rank).toBe(1);
  });

  test("GET /api/materials mengembalikan status 200 dan array data", async () => {
    const res = await request(app)
      .get("/api/materials")
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("POST /api/materials tanpa token mengembalikan status 401", async () => {
    const res = await request(app).post("/api/materials").send({});
    expect(res.statusCode).toBe(401);
  });

  test("POST /api/usage dengan jumlah pemakaian melebihi stok mengembalikan status 400", async () => {
    if (!sampleMaterialId) {
      console.warn("⚠️  SKIP: tidak ada sample material_id untuk tes ini.");
      return;
    }
    const res = await request(app)
      .post("/api/usage")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({
        material_id: sampleMaterialId,
        qty_of_usage: 999999999, // sengaja jauh melebihi stok berapapun
        usage_date: new Date().toISOString().split("T")[0],
      });

    expect(res.statusCode).toBe(400);
  });

  test("PUT /api/purchase-requests/:id/approve oleh role non-manager mengembalikan status 403", async () => {
    // Role check terjadi SEBELUM controller cek data, jadi ID sembarang cukup
    // untuk menguji penolakan berbasis role (tidak perlu data pengajuan asli).
    const res = await request(app)
      .put("/api/purchase-requests/1/approve")
      .set("Authorization", `Bearer ${technicianToken}`)
      .send({});

    expect(res.statusCode).toBe(403);
  });
});
