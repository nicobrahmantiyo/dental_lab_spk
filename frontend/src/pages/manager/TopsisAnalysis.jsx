// frontend/src/pages/manager/TopsisAnalysis.jsx
import { useState, useEffect } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  BarChart3,
  Play,
  Settings,
  Trophy,
  Building2,
  Package,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const RANK_COLOR = [
  "#f59e0b",
  "#6b7280",
  "#cd7f32",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
];

export default function TopsisAnalysis() {
  const [criteria, setCriteria] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialId, setMaterialId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editWeight, setEditWeight] = useState(false);
  const [weights, setWeights] = useState({});
  const [note, setNote] = useState("");

  useEffect(() => {
    api.get("/topsis/criteria?topsis_type=VENDOR").then((r) => {
      setCriteria(r.data.data);
      const w = {};
      r.data.data.forEach((c) => {
        w[c.id] = c.weight;
      });
      setWeights(w);
    });
    api.get("/materials").then((r) => setMaterials(r.data.data || []));
  }, []);

  const totalWeight = Object.values(weights).reduce(
    (a, b) => a + parseFloat(b || 0),
    0
  );

  const saveWeights = async () => {
    if (Math.abs(totalWeight - 1) > 0.001)
      return toast.error(
        `Total bobot harus = 1. Saat ini: ${totalWeight.toFixed(4)}`
      );
    for (const c of criteria) {
      await api.put(`/topsis/criteria/${c.id}`, {
        ...c,
        weight: parseFloat(weights[c.id]),
      });
    }
    toast.success("Bobot disimpan!");
    setEditWeight(false);
  };

  const handleAnalyze = async () => {
    if (!materialId) return toast.error("Pilih material terlebih dahulu");
    const mat = materials.find((m) => m.id === parseInt(materialId));
    setLoading(true);
    try {
      const { data } = await api.post("/topsis/analyze", {
        material_id: parseInt(materialId),
        title: `Pemilihan Vendor ${
          mat?.kode_barang
        } — ${new Date().toLocaleDateString("id-ID")}`,
        note: note || null,
      });
      setResults(data.data);
      toast.success("Analisis TOPSIS selesai! Vendor terbaik ditemukan.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menjalankan analisis");
    } finally {
      setLoading(false);
    }
  };

  const selectedMat = materials.find((m) => m.id === parseInt(materialId));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analisis TOPSIS</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pilih vendor terbaik untuk material berdasarkan harga, kualitas, lead
          time, dan reputasi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Panel Kriteria */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings size={16} /> Bobot Kriteria Vendor
            </h2>
            <button
              onClick={() => setEditWeight((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {editWeight ? "Batal" : "Edit"}
            </button>
          </div>
          <div className="space-y-3">
            {criteria.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {c.code}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {c.name}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                    ${
                      c.type === "BENEFIT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {c.type}
                  </span>
                </div>
                {editWeight ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="input-field w-20 text-right text-xs"
                    value={weights[c.id] || 0}
                    onChange={(e) =>
                      setWeights((p) => ({ ...p, [c.id]: e.target.value }))
                    }
                  />
                ) : (
                  <span className="font-bold text-blue-600 text-sm w-10 text-right">
                    {(parseFloat(c.weight) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>
          {editWeight && (
            <div className="mt-4 space-y-2">
              <p
                className={`text-xs font-medium ${
                  Math.abs(totalWeight - 1) > 0.001
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                Total: {(totalWeight * 100).toFixed(1)}%
                {Math.abs(totalWeight - 1) > 0.001 ? " ⚠️ harus 100%" : " ✓"}
              </p>
              <button
                onClick={saveWeights}
                className="btn-primary w-full justify-center text-xs py-2"
              >
                Simpan Bobot
              </button>
            </div>
          )}
        </div>

        {/* Panel Pilih Material & Jalankan */}
        <div className="card lg:col-span-2 flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Building2 size={16} /> Pilih Material untuk Analisis Vendor
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Sistem akan membandingkan semua vendor yang menyediakan material
              ini dan merekomendasikan yang terbaik.
            </p>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Material *
              </label>
              <select
                className="input-field"
                value={materialId}
                onChange={(e) => {
                  setMaterialId(e.target.value);
                  setResults(null);
                }}
              >
                <option value="">-- Pilih Material --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.kode_barang}] {m.nama_barang}
                    {parseFloat(m.current_stock) <= parseFloat(m.min_stock)
                      ? " ⚠️ Stok Menipis"
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            {selectedMat && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex items-center gap-3 mb-3">
                <Package size={16} className="text-gray-400 shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">
                    {selectedMat.nama_barang}
                  </p>
                  <p className="text-gray-500">
                    Stok:{" "}
                    <span
                      className={
                        parseFloat(selectedMat.current_stock) <=
                        parseFloat(selectedMat.min_stock)
                          ? "text-red-600 font-semibold"
                          : "text-gray-700"
                      }
                    >
                      {selectedMat.current_stock} {selectedMat.unit}
                    </span>{" "}
                    · Min: {selectedMat.min_stock} · Kategori:{" "}
                    {selectedMat.category_name || "-"}
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Catatan (opsional)
              </label>
              <input
                className="input-field text-sm"
                placeholder="Contoh: untuk restock bulan Juli..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
            <p className="font-medium mb-2">Kriteria pemilihan vendor :</p>
            <div className="space-y-1.5 text-blue-700">
              <div>
                <span className="font-bold">C1 — Harga</span>{" "}
                <span className="bg-red-100 text-red-700 px-1 rounded text-[10px] font-medium">
                  COST · 40%
                </span>
                <p className="mt-0.5">
                  Rubrik: 1=≤Rp275rb · 2=Rp276-350rb · 3=Rp351-425rb ·
                  4=&gt;Rp425rb
                </p>
              </div>
              <div>
                <span className="font-bold">
                  C2 — Kualitas / Flexural Strength
                </span>{" "}
                <span className="bg-green-100 text-green-700 px-1 rounded text-[10px] font-medium">
                  BENEFIT · 30%
                </span>
                <p className="mt-0.5">
                  Rubrik (ISO 6872): 1=&lt;800 · 2=800-1000 · 3=1001-1200 ·
                  4=&gt;1200 MPa
                </p>
              </div>
              <div>
                <span className="font-bold">C3 — Lead Time</span>{" "}
                <span className="bg-green-100 text-green-700 px-1 rounded text-[10px] font-medium">
                  BENEFIT · 20%
                </span>
                <p className="mt-0.5">
                  Rubrik: 4=1-3 hari · 3=4-7 hari · 2=8-14 hari · 1=&gt;14 hari
                </p>
              </div>
              <div>
                <span className="font-bold">C4 — Reputasi Vendor</span>{" "}
                <span className="bg-green-100 text-green-700 px-1 rounded text-[10px] font-medium">
                  BENEFIT · 10%
                </span>
                <p className="mt-0.5">
                  Rubrik (usia perusahaan): 1=&lt;3thn · 2=3-7thn · 3=8-15thn ·
                  4=&gt;15thn
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !materialId}
            className="btn-primary w-full justify-center py-3 mt-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Menganalisis vendor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play size={16} /> Jalankan Analisis TOPSIS
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Hasil ── */}
      {results && (
        <div className="space-y-4">
          {/* Rekomendasi utama */}
          <div className="p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
              <Trophy size={22} className="text-yellow-900" />
            </div>
            <div>
              <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-0.5">
                Vendor Terbaik untuk {results.material?.nama_barang}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {results.best_vendor?.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Nilai Preferensi Ci:{" "}
                <strong className="text-blue-600 text-base">
                  {(results.best_vendor?.preference_score * 100).toFixed(2)}%
                </strong>
                <span className="text-gray-400 text-xs ml-2">
                  (D+ = {results.best_vendor?.d_positive?.toFixed(4)}, D− ={" "}
                  {results.best_vendor?.d_negative?.toFixed(4)})
                </span>
              </p>
            </div>
          </div>

          {/* Grafik */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={18} /> Grafik Nilai Preferensi (Ci) —
              Perbandingan Vendor
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={results.results.map((r) => ({
                  name: r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name,
                  full: r.name,
                  score: parseFloat((r.preference_score * 100).toFixed(2)),
                  rank: r.rank,
                }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v, n, p) => [`${v}%`, `Rank #${p.payload.rank}`]}
                  labelFormatter={(l, payload) =>
                    payload?.[0]?.payload?.full || l
                  }
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {results.results.map((r, i) => (
                    <Cell key={r.id} fill={RANK_COLOR[i] || "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabel Ranking */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" /> Ranking Akhir
              Vendor
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-center px-4 py-3">Rank</th>
                    <th className="text-left px-4 py-3">Vendor</th>
                    <th className="text-right px-4 py-3">D+</th>
                    <th className="text-right px-4 py-3">D−</th>
                    <th className="text-right px-4 py-3">Nilai Ci</th>
                    <th className="text-left px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.results.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 ${
                        i === 0 ? "bg-yellow-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                          ${
                            i === 0
                              ? "bg-yellow-400 text-yellow-900"
                              : i === 1
                              ? "bg-gray-300 text-gray-700"
                              : i === 2
                              ? "bg-orange-300 text-orange-900"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {r.name}
                        {i === 0 && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                            ⭐ Rekomendasi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {r.d_positive?.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {r.d_negative?.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {(r.preference_score * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        {i === 0 && (
                          <span className="badge-out text-xs">
                            🥇 Sangat Direkomendasikan
                          </span>
                        )}
                        {i === 1 && (
                          <span className="badge-low text-xs">
                            🥈 Direkomendasikan
                          </span>
                        )}
                        {i === 2 && (
                          <span className="badge-pending text-xs">
                            🥉 Kurang Direkomendasikan
                          </span>
                        )}
                        {i > 2 && (
                          <span className="badge-ok text-xs">
                            Pertimbangkan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel Detail — Matriks Keputusan (Skala 1-4) */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-1">
              Detail Perhitungan TOPSIS
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Nilai sudah dikonversi ke skala 1–4
            </p>

            {/* Matriks Keputusan */}
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Matriks Keputusan (X) — Skala 1-4
            </p>
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-xs border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border border-gray-200">
                      Vendor
                    </th>
                    {results.criteria.map((c) => (
                      <th
                        key={c.code}
                        className="px-3 py-2 text-center border border-gray-200"
                      >
                        {c.code}
                        <br />
                        <span className="font-normal text-gray-500">
                          {c.name}
                        </span>
                        <br />
                        <span
                          className={`text-[10px] ${
                            c.type === "BENEFIT"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {c.type} · {(c.weight * 100).toFixed(0)}%
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr
                      key={r.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 font-medium border border-gray-200">
                        {r.name}
                        {i === 0 && " ⭐"}
                      </td>
                      {r.raw_values.map((v, j) => (
                        <td
                          key={j}
                          className="px-3 py-2 text-center font-mono border border-gray-200"
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Solusi Ideal */}
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Solusi Ideal Positif (A+) dan Negatif (A−)
            </p>
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-xs border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border border-gray-200">
                      Solusi
                    </th>
                    {results.criteria.map((c) => (
                      <th
                        key={c.code}
                        className="px-3 py-2 text-center border border-gray-200"
                      >
                        {c.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50">
                    <td className="px-3 py-2 font-medium border border-gray-200 text-green-700">
                      A+ (Ideal Positif)
                    </td>
                    {results.ideal_positive.map((v, j) => (
                      <td
                        key={j}
                        className="px-3 py-2 text-center font-mono border border-gray-200 text-green-700"
                      >
                        {v?.toFixed(6)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-3 py-2 font-medium border border-gray-200 text-red-700">
                      A− (Ideal Negatif)
                    </td>
                    {results.ideal_negative.map((v, j) => (
                      <td
                        key={j}
                        className="px-3 py-2 text-center font-mono border border-gray-200 text-red-700"
                      >
                        {v?.toFixed(6)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Nilai Mentah */}
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Data Mentah Vendor (sumber: situs resmi / Shopee)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border border-gray-200">
                      Vendor
                    </th>
                    <th className="px-3 py-2 text-right border border-gray-200">
                      Harga (Rp)
                    </th>
                    <th className="px-3 py-2 text-center border border-gray-200">
                      Flexural (MPa)
                    </th>
                    <th className="px-3 py-2 text-center border border-gray-200">
                      Lead Time (hari)
                    </th>
                    <th className="px-3 py-2 text-center border border-gray-200">
                      Usia Vendor (thn)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr
                      key={r.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2 font-medium border border-gray-200">
                        {r.name}
                      </td>
                      <td className="px-3 py-2 text-right border border-gray-200">
                        {r.raw_raw?.harga_rp
                          ? `Rp ${Number(r.raw_raw.harga_rp).toLocaleString(
                              "id-ID"
                            )}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-center border border-gray-200">
                        {r.raw_raw?.flexural_mpa ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center border border-gray-200">
                        {r.raw_raw?.lead_time_days ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center border border-gray-200">
                        {r.raw_raw?.reputation_years ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
