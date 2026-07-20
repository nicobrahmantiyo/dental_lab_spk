const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

let tokenAdmin, tokenManager, tokenTeknisi;
let createdMaterialId;
let createdVendorId;

beforeAll(async () => {
  const loginAs = async (username, password) => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username, password });
    if (res.statusCode !== 200) {
      throw new Error(`Login ${username} gagal (status ${res.statusCode})`);
    }
    return res.body.token;
  };

  tokenAdmin = await loginAs("admin1", "Admin@123");
  tokenManager = await loginAs("manager1", "Man@123");
  tokenTeknisi = await loginAs("teknisi1", "Tek@123");
}, 20000);

afterAll(async () => {
  // Bersihkan data uji
  if (createdMaterialId) {
    await pool
      .execute("DELETE FROM materials WHERE id=?", [createdMaterialId])
      .catch(() => {});
  }
  if (createdVendorId) {
    await pool
      .execute("DELETE FROM vendors WHERE id=?", [createdVendorId])
      .catch(() => {});
  }
  await pool.end();
});

describe("Integrasi API Material (CRUD)", () => {
  test("POST /api/materials dengan token admin & data valid mengembalikan status 201", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        kode_barang: `TEST-MAT-${Date.now()}`,
        nama_barang: "Material Uji Coverage",
        unit: "pcs",
        min_stock: 5,
        price_per_unit: 100000,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
    createdMaterialId = res.body.id;
  });

  test("POST /api/materials oleh role non-admin (teknisi) mengembalikan status 403", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${tokenTeknisi}`)
      .send({
        kode_barang: `TEST-REJECT-${Date.now()}`,
        nama_barang: "Ditolak",
      });

    expect(res.statusCode).toBe(403);
  });

  test("GET /api/materials/:id mengembalikan detail material yang baru dibuat", async () => {
    const res = await request(app)
      .get(`/api/materials/${createdMaterialId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.nama_barang).toBe("Material Uji Coverage");
  });

  test("GET /api/materials/:id dengan id tidak ada mengembalikan status 404", async () => {
    const res = await request(app)
      .get("/api/materials/999999999")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(404);
  });

  test("PUT /api/materials/:id mengubah data material mengembalikan status 200", async () => {
    const res = await request(app)
      .put(`/api/materials/${createdMaterialId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        nama_barang: "Material Uji Coverage (Updated)",
        unit: "box",
        min_stock: 10,
        price_per_unit: 150000,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("POST /api/materials dengan kode_barang duplikat mengembalikan status 409", async () => {
    // Ambil kode_barang milik material yang sudah dibuat di test pertama
    const getRes = await request(app)
      .get(`/api/materials/${createdMaterialId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    const existingKode = getRes.body.data.kode_barang;

    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ kode_barang: existingKode, nama_barang: "Duplikat" });

    expect(res.statusCode).toBe(409);
  });

  test("GET /api/materials/categories mengembalikan status 200", async () => {
    const res = await request(app)
      .get("/api/materials/categories")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
  });

  test("GET /api/materials/brands mengembalikan status 200", async () => {
    const res = await request(app)
      .get("/api/materials/brands")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
  });

  test("DELETE /api/materials/:id (soft delete) mengembalikan status 200", async () => {
    const res = await request(app)
      .delete(`/api/materials/${createdMaterialId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);

    // Verifikasi material sudah tidak muncul lagi di GET by id (is_active=0)
    const checkRes = await request(app)
      .get(`/api/materials/${createdMaterialId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(checkRes.statusCode).toBe(404);
  });
});

describe("Integrasi API Vendor (CRUD)", () => {
  test("POST /api/vendors dengan token manager & data valid mengembalikan status 201", async () => {
    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", `Bearer ${tokenManager}`)
      .send({
        name: `Vendor Uji Coverage ${Date.now()}`,
        contact_person: "Budi Tester",
        phone: "081234567890",
        lead_time_days: 7,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    createdVendorId = res.body.id;
  });

  test("POST /api/vendors tanpa nama mengembalikan status 400", async () => {
    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", `Bearer ${tokenManager}`)
      .send({ contact_person: "Tanpa Nama" });

    expect(res.statusCode).toBe(400);
  });

  test("POST /api/vendors oleh role non-manager (admin) mengembalikan status 403", async () => {
    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ name: "Vendor Ditolak" });

    expect(res.statusCode).toBe(403);
  });

  test("GET /api/vendors/:id mengembalikan detail vendor yang baru dibuat", async () => {
    const res = await request(app)
      .get(`/api/vendors/${createdVendorId}`)
      .set("Authorization", `Bearer ${tokenManager}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.contact_person).toBe("Budi Tester");
  });

  test("PUT /api/vendors/:id mengubah data vendor mengembalikan status 200", async () => {
    const res = await request(app)
      .put(`/api/vendors/${createdVendorId}`)
      .set("Authorization", `Bearer ${tokenManager}`)
      .send({ name: "Vendor Uji Coverage (Updated)", lead_time_days: 3 });

    expect(res.statusCode).toBe(200);
  });

  test("DELETE /api/vendors/:id mengembalikan status 200", async () => {
    const res = await request(app)
      .delete(`/api/vendors/${createdVendorId}`)
      .set("Authorization", `Bearer ${tokenManager}`);

    expect(res.statusCode).toBe(200);
  });
});
