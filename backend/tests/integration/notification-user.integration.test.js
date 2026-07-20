const request = require("supertest");
const app = require("../../src/app");
const pool = require("../../src/config/database");

let tokenAdmin, tokenManager;
let createdUserId;

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
}, 20000);

afterAll(async () => {
  if (createdUserId) {
    await pool
      .execute("DELETE FROM users WHERE id=?", [createdUserId])
      .catch(() => {});
  }
  await pool.end();
});

describe("Integrasi API Notifikasi", () => {
  test("GET /api/notifications mengembalikan status 200 dan array", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${tokenManager}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/notifications/unread-count mengembalikan status 200 dan angka count", async () => {
    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set("Authorization", `Bearer ${tokenManager}`);

    expect(res.statusCode).toBe(200);
    expect(typeof res.body.count).toBe("number");
  });

  test("PUT /api/notifications/mark-all-read mengembalikan status 200", async () => {
    const res = await request(app)
      .put("/api/notifications/mark-all-read")
      .set("Authorization", `Bearer ${tokenManager}`);

    expect(res.statusCode).toBe(200);
  });

  test("GET /api/notifications tanpa token mengembalikan status 401", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.statusCode).toBe(401);
  });
});

describe("Integrasi API Manajemen User (admin only)", () => {
  test("GET /api/users dengan token admin mengembalikan status 200", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
  });

  test("GET /api/users oleh role non-admin (manager) mengembalikan status 403", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenManager}`);

    expect(res.statusCode).toBe(403);
  });

  test("POST /api/users membuat user baru mengembalikan status 201", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        username: `testuser${Date.now()}`,
        full_name: "User Uji Coverage",
        email: `testuser${Date.now()}@example.com`,
        password: "TestPass123",
        role_id: 2,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    createdUserId = res.body.id;
  });
});
