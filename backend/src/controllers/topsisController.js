// backend/src/controllers/topsisController.js
// Sesuai Skripsi BAB 3.3 — TOPSIS 4 Kriteria Vendor
const pool = require("../config/database");
const { runTopsis } = require("../services/topsisService");

// ─── Fungsi Konversi Nilai Mentah → Skala 1-4 (sesuai Skripsi BAB 3.3.2.1) ───

/**
 * C1 — Harga (COST)
 * Rubrik: 1=Rp200-275rb, 2=Rp276-350rb, 3=Rp351-425rb, 4=>Rp425rb
 */
function hargaToSkala(rp) {
  const v = parseFloat(rp) || 0;
  if (v <= 275000) return 1;
  if (v <= 350000) return 2;
  if (v <= 425000) return 3;
  return 4;
}

/**
 * C2 — Kualitas / Flexural Strength (BENEFIT)
 * Rubrik ISO 6872: 1=<800 MPa, 2=800-1000, 3=1001-1200, 4=>1200
 */
function flexuralToSkala(mpa) {
  const v = parseFloat(mpa) || 0;
  if (v > 1200) return 4;
  if (v >= 1001) return 3;
  if (v >= 800) return 2;
  return 1;
}

/**
 * C3 — Lead Time (BENEFIT — 4=tercepat, 1=terlambat)
 * Rubrik: 4=1-3hari, 3=4-7hari, 2=8-14hari, 1=>14hari
 */
function leadTimeToSkala(days) {
  const v = parseFloat(days) || 0;
  if (v <= 3) return 4;
  if (v <= 7) return 3;
  if (v <= 14) return 2;
  return 1;
}

/**
 * C4 — Reputasi Vendor / Usia Perusahaan (BENEFIT)
 * Rubrik: 1=<3thn, 2=3-7thn, 3=8-15thn, 4=>15thn
 */
function reputasiToSkala(years) {
  const v = parseFloat(years) || 0;
  if (v > 15) return 4;
  if (v >= 8) return 3;
  if (v >= 3) return 2;
  return 1;
}

/**
 * Map kode kriteria → fungsi ambil nilai dari baris vendor_prices
 * Output: nilai skala 1-4 siap pakai TOPSIS
 */
const CRITERIA_MAP = {
  C1: (vp) => hargaToSkala(vp.price_per_unit),
  C2: (vp) => flexuralToSkala(vp.flexural_strength),
  C3: (vp) => leadTimeToSkala(vp.lead_time_days ?? vp.vendor_lead_time),
  C4: (vp) => reputasiToSkala(vp.reputation_years),
};

// ─── GET /api/topsis/criteria ──────────────────────────────────────────────
exports.getCriteria = async (req, res, next) => {
  try {
    const { topsis_type } = req.query;
    let sql = "SELECT * FROM criteria WHERE is_active=1";
    const params = [];
    if (topsis_type) {
      sql += " AND topsis_type=?";
      params.push(topsis_type.toUpperCase());
    }
    sql += " ORDER BY code";
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/topsis/criteria/:id ─────────────────────────────────────────
exports.updateCriteria = async (req, res, next) => {
  try {
    const { name, type, weight, description } = req.body;
    await pool.execute(
      "UPDATE criteria SET name=?,type=?,weight=?,description=? WHERE id=?",
      [name, type, weight, description, req.params.id]
    );
    res.json({ success: true, message: "Kriteria berhasil diupdate" });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/topsis/analyze ─────────────────────────────────────────────
// Pilih vendor terbaik untuk 1 material menggunakan metode TOPSIS
// Sesuai Skripsi BAB 3.3: 4 kriteria C1-C4, bobot 0.40/0.30/0.20/0.10
exports.analyze = async (req, res, next) => {
  try {
    const { material_id, title, note } = req.body;

    if (!material_id)
      return res.status(400).json({
        success: false,
        message: "material_id wajib diisi",
      });

    // 1. Ambil kriteria VENDOR yang aktif (C1-C4)
    const [criteriaRows] = await pool.execute(
      "SELECT * FROM criteria WHERE is_active=1 AND topsis_type='VENDOR' ORDER BY code"
    );
    if (!criteriaRows.length)
      return res.status(400).json({
        success: false,
        message: "Tidak ada kriteria VENDOR aktif. Periksa tabel criteria.",
      });

    // 2. Ambil data vendor & harga untuk material ini
    const [vendorPrices] = await pool.execute(
      `SELECT vp.*, v.name AS vendor_name, v.lead_time_days AS vendor_lead_time
       FROM vendor_prices vp
       JOIN vendors v ON vp.vendor_id = v.id
       WHERE vp.material_id = ? AND vp.is_active = 1 AND v.is_active = 1
       ORDER BY v.name`,
      [material_id]
    );

    if (vendorPrices.length < 2)
      return res.status(400).json({
        success: false,
        message: `Minimal 2 vendor harus tersedia untuk analisis TOPSIS. Saat ini hanya ${vendorPrices.length} vendor. Tambahkan data harga vendor terlebih dahulu.`,
      });

    // 3. Bangun matriks keputusan — nilai skala 1-4 (sesuai rubrik skripsi BAB 3.3.2.1)
    const alternatives = vendorPrices.map((vp) => {
      const rawValues = criteriaRows.map((c) => {
        const fn = CRITERIA_MAP[c.code];
        if (!fn) return 0;
        return fn(vp);
      });

      // Simpan juga nilai mentah untuk ditampilkan di frontend
      const rawRawValues = {
        harga_rp: parseFloat(vp.price_per_unit) || 0,
        flexural_mpa: parseFloat(vp.flexural_strength) || 0,
        lead_time_days:
          parseFloat(vp.lead_time_days ?? vp.vendor_lead_time) || 0,
        reputation_years: parseFloat(vp.reputation_years) || 0,
      };

      return {
        id: vp.vendor_id,
        name: vp.vendor_name,
        values: rawValues, // skala 1-4, input ke TOPSIS
        raw_raw: rawRawValues, // nilai mentah asli
      };
    });

    const criteria = criteriaRows.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      weight: parseFloat(c.weight),
    }));

    // 4. Jalankan TOPSIS
    const topsisResult = runTopsis(alternatives, criteria);

    // 5. Gabungkan raw_raw ke hasil akhir
    const resultsWithRaw = topsisResult.results.map((r) => {
      const alt = alternatives.find((a) => a.id === r.id);
      return { ...r, raw_raw: alt?.raw_raw || {} };
    });

    // 6. Ambil info material
    const [matInfo] = await pool.execute(
      "SELECT id, kode_barang, nama_barang FROM materials WHERE id=?",
      [material_id]
    );

    // 7. Simpan ke database
    const [saved] = await pool.execute(
      `INSERT INTO topsis_results
        (analyzed_by, material_id, topsis_type, title, note, criteria_snapshot)
       VALUES (?,?,?,?,?,?)`,
      [
        req.user.id,
        material_id,
        "VENDOR",
        title ||
          `Analisis Vendor ${
            matInfo[0]?.kode_barang
          } — ${new Date().toLocaleDateString("id-ID")}`,
        note || null,
        JSON.stringify(criteria),
      ]
    );
    const resultId = saved.insertId;

    for (const r of resultsWithRaw) {
      await pool.execute(
        `INSERT INTO topsis_detail_results
          (result_id, vendor_id, ranking, preference_score,
           d_positive, d_negative, raw_values, normalized_matrix, weighted_matrix)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          resultId,
          r.id,
          r.rank,
          r.preference_score,
          r.d_positive,
          r.d_negative,
          JSON.stringify({ skala: r.raw_values, mentah: r.raw_raw }),
          JSON.stringify(r.normalized_row),
          JSON.stringify(r.weighted_row),
        ]
      );
    }

    // 8. Tambahkan data skala ke criteria untuk ditampilkan
    const criteriaWithSkala = criteria.map((c) => ({
      ...c,
      rubrik: getRubrik(c.code),
    }));

    res.json({
      success: true,
      message: "Analisis TOPSIS berhasil",
      data: {
        result_id: resultId,
        material: matInfo[0],
        criteria: criteriaWithSkala,
        ideal_positive: topsisResult.idealPositive,
        ideal_negative: topsisResult.idealNegative,
        results: resultsWithRaw,
        best_vendor: resultsWithRaw[0],
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Kembalikan teks rubrik untuk ditampilkan di frontend */
function getRubrik(code) {
  const rubrik = {
    C1: "4=Sangat Mahal (>Rp425rb), 3=Mahal, 2=Murah, 1=Sangat Murah (≤Rp275rb)",
    C2: "4=>1200 MPa, 3=1001-1200, 2=800-1000, 1=<800 MPa",
    C3: "4=1-3 hari, 3=4-7 hari, 2=8-14 hari, 1=>14 hari",
    C4: "4=>15 thn, 3=8-15 thn, 2=3-7 thn, 1=<3 thn",
  };
  return rubrik[code] || "";
}

// ─── GET /api/topsis/history ──────────────────────────────────────────────
exports.getHistory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT tr.*, u.full_name AS analyzed_by_name,
              m.nama_barang AS material_name,
              m.kode_barang AS material_code,
              COUNT(tdr.id) AS total_vendors
       FROM topsis_results tr
       JOIN users u     ON tr.analyzed_by = u.id
       LEFT JOIN materials m ON tr.material_id = m.id
       LEFT JOIN topsis_detail_results tdr ON tr.id = tdr.result_id
       WHERE tr.topsis_type = 'VENDOR'
       GROUP BY tr.id
       ORDER BY tr.created_at DESC
       LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/topsis/history/:id ─────────────────────────────────────────
exports.getHistoryDetail = async (req, res, next) => {
  try {
    const [header] = await pool.execute(
      `SELECT tr.*, u.full_name AS analyzed_by_name,
              m.nama_barang AS material_name, m.kode_barang AS material_code
       FROM topsis_results tr
       JOIN users u ON tr.analyzed_by = u.id
       LEFT JOIN materials m ON tr.material_id = m.id
       WHERE tr.id = ?`,
      [req.params.id]
    );
    if (!header.length)
      return res
        .status(404)
        .json({ success: false, message: "Hasil tidak ditemukan" });

    const [details] = await pool.execute(
      `SELECT tdr.*, v.name AS vendor_name
       FROM topsis_detail_results tdr
       LEFT JOIN vendors v ON tdr.vendor_id = v.id
       WHERE tdr.result_id = ?
       ORDER BY tdr.ranking`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...header[0], details } });
  } catch (err) {
    next(err);
  }
};
