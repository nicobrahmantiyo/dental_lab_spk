// backend/tests/unit/topsis.test.js
//
// Unit Testing algoritma TOPSIS (sesuai skripsi BAB 4.2.2 & Tabel 4.6).
// Menguji fungsi runTopsis() di src/services/topsisService.js secara
// terisolasi (tanpa database), memakai studi kasus 3 vendor alternatif
// (Upcera, Aidite, Vsmile) dengan 4 kriteria yang sama persis dengan
// perhitungan manual pada BAB III (sub bab 3.2.5.4 s.d. 3.2.5.11 / Tabel 3.28).

const { runTopsis } = require("../../src/services/topsisService");

describe("Algoritma TOPSIS - Studi Kasus Pemilihan Vendor (Tabel 3.28)", () => {
  const kriteria = [
    { code: "C1", name: "Harga", weight: 0.4, type: "COST" },
    { code: "C2", name: "Kualitas", weight: 0.3, type: "BENEFIT" },
    { code: "C3", name: "Lead Time", weight: 0.2, type: "BENEFIT" },
    { code: "C4", name: "Reputasi", weight: 0.1, type: "BENEFIT" },
  ];

  const alternatif = [
    { id: 1, name: "Upcera", values: [4, 4, 3, 4] },
    { id: 2, name: "Aidite", values: [3, 3, 3, 3] },
    { id: 3, name: "Vsmile", values: [2, 2, 1, 2] },
  ];

  const { results } = runTopsis(alternatif, kriteria);
  const getHasil = (nama) => results.find((h) => h.name === nama);

  test("nilai Ci vendor Upcera sesuai perhitungan manual (0.5008)", () => {
    expect(getHasil("Upcera").preference_score).toBeCloseTo(0.5008, 3);
  });

  test("nilai Ci vendor Aidite sesuai perhitungan manual (0.5820)", () => {
    expect(getHasil("Aidite").preference_score).toBeCloseTo(0.582, 3);
  });

  test("nilai Ci vendor Vsmile sesuai perhitungan manual (0.4992)", () => {
    expect(getHasil("Vsmile").preference_score).toBeCloseTo(0.4992, 3);
  });

  test("Aidite menjadi vendor dengan ranking pertama", () => {
    expect(getHasil("Aidite").rank).toBe(1);
  });

  test("Vsmile menjadi vendor dengan ranking terakhir", () => {
    expect(getHasil("Vsmile").rank).toBe(3);
  });
});

describe("Algoritma TOPSIS - kasus tepi (edge cases)", () => {
  const kriteria = [{ code: "C1", name: "Harga", weight: 1, type: "COST" }];

  test("melempar error jika data alternatif kosong", () => {
    expect(() => runTopsis([], kriteria)).toThrow();
  });

  test("melempar error jika data kriteria kosong", () => {
    expect(() => runTopsis([{ id: 1, name: "A", values: [1] }], [])).toThrow();
  });

  test("tidak error saat seluruh alternatif punya nilai identik (denom = 0 dihandle)", () => {
    const alt = [
      { id: 1, name: "A", values: [0] },
      { id: 2, name: "B", values: [0] },
    ];
    const { results } = runTopsis(alt, kriteria);
    expect(results).toHaveLength(2);
    results.forEach((r) =>
      expect(Number.isNaN(r.preference_score)).toBe(false)
    );
  });
});
