// frontend/src/pages/admin/VendorPrices.jsx
// Form sesuai Skripsi BAB 3.3 — 4 kolom kriteria TOPSIS vendor
import { useState, useEffect } from "react";
import api from "../../api/axios";
import Modal from "../../components/ui/Modal";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, DollarSign, Info } from "lucide-react";

const EMPTY = {
  vendor_id: "",
  material_id: "",
  price_per_unit: "",
  flexural_strength: "",
  lead_time_days: "",
  reputation_years: "",
  certifications: "",
};

// ── Fungsi konversi ke skala 1-4 (sama dengan backend, untuk preview UI) ──
const hargaToSkala = (rp) => {
  const v = parseFloat(rp) || 0;
  if (v <= 275000) return 1;
  if (v <= 350000) return 2;
  if (v <= 425000) return 3;
  return 4;
};
const flexuralToSkala = (mpa) => {
  const v = parseFloat(mpa) || 0;
  if (v > 1200) return 4;
  if (v >= 1001) return 3;
  if (v >= 800) return 2;
  return 1;
};
const leadTimeToSkala = (days) => {
  const v = parseFloat(days) || 0;
  if (v <= 3) return 4;
  if (v <= 7) return 3;
  if (v <= 14) return 2;
  return 1;
};
const reputasiToSkala = (years) => {
  const v = parseFloat(years) || 0;
  if (v > 15) return 4;
  if (v >= 8) return 3;
  if (v >= 3) return 2;
  return 1;
};

const SKALA_BADGE = {
  1: "bg-red-100 text-red-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-blue-100 text-blue-700",
  4: "bg-green-100 text-green-700",
};
const SkalaBadge = ({ val }) => (
  <span
    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
      SKALA_BADGE[val] || "bg-gray-100 text-gray-500"
    }`}
  >
    {val || "—"}
  </span>
);

export default function VendorPrices() {
  const [prices, setPrices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterVendor, setFilterVendor] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/vendor-prices/all");
      setPrices(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([api.get("/vendors"), api.get("/materials")]).then(([v, m]) => {
      setVendors(v.data.data);
      setMaterials(m.data.data);
    });
    load();
  }, []);

  const f = (p) => (e) => setForm((prev) => ({ ...prev, [p]: e.target.value }));

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY);
    setModal(true);
  };
  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      vendor_id: p.vendor_id,
      material_id: p.material_id,
      price_per_unit: p.price_per_unit,
      flexural_strength: p.flexural_strength || "",
      lead_time_days: p.lead_time_days || "",
      reputation_years: p.reputation_years || "",
      certifications: p.certifications || "",
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.vendor_id || !form.material_id || !form.price_per_unit)
      return toast.error("Vendor, material, dan harga wajib diisi");
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/vendor-prices/${editItem.id}`, form);
        toast.success("Harga vendor diupdate");
      } else {
        await api.post("/vendor-prices", form);
        toast.success("Harga vendor ditambahkan");
      }
      setModal(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus data harga vendor ini?")) return;
    await api.delete(`/vendor-prices/${id}`);
    toast.success("Data dihapus");
    load();
  };

  const filtered = filterVendor
    ? prices.filter((p) => p.vendor_id == filterVendor)
    : prices;

  // Preview skala dari form
  const previewSkala = {
    c1: form.price_per_unit ? hargaToSkala(form.price_per_unit) : null,
    c2: form.flexural_strength ? flexuralToSkala(form.flexural_strength) : null,
    c3: form.lead_time_days ? leadTimeToSkala(form.lead_time_days) : null,
    c4: form.reputation_years ? reputasiToSkala(form.reputation_years) : null,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Harga & Kriteria Vendor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Data vendor per material — kriteria C1–C4 untuk analisis TOPSIS
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      {/* Info Rubrik Skripsi */}
      <div className="card mb-4 bg-blue-50 border-blue-200 p-4 flex gap-3">
        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-1">
          <p className="font-semibold text-sm mb-2">
            Rubrik Konversi Skala 1–4
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div>
              <p className="font-medium">C1 — Harga (COST, bobot 40%)</p>
              <p className="text-blue-700">
                1=≤Rp275rb · 2=276-350rb · 3=351-425rb · 4=&gt;425rb
              </p>
            </div>
            <div>
              <p className="font-medium">
                C2 — Kualitas / Flexural Strength (BENEFIT, 30%)
              </p>
              <p className="text-blue-700">
                1=&lt;800 MPa · 2=800-1000 · 3=1001-1200 · 4=&gt;1200 MPa
              </p>
            </div>
            <div>
              <p className="font-medium">C3 — Lead Time (BENEFIT, 20%)</p>
              <p className="text-blue-700">
                4=1-3 hari · 3=4-7 hari · 2=8-14 hari · 1=&gt;14 hari
              </p>
            </div>
            <div>
              <p className="font-medium">
                C4 — Reputasi / Usia Perusahaan (BENEFIT, 10%)
              </p>
              <p className="text-blue-700">
                1=&lt;3 thn · 2=3-7 thn · 3=8-15 thn · 4=&gt;15 thn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-4 p-4">
        <label className="block text-xs text-gray-500 mb-1">
          Filter Vendor
        </label>
        <select
          className="input-field max-w-xs"
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
        >
          <option value="">Semua Vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabel */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Vendor</th>
                  <th className="text-left px-4 py-3">Material</th>
                  <th className="text-right px-4 py-3">Harga/Unit</th>
                  <th className="text-center px-4 py-3">
                    C1
                    <br />
                    <span className="text-[10px] text-gray-400 normal-case">
                      Skala Harga
                    </span>
                  </th>
                  <th className="text-center px-4 py-3">
                    C2
                    <br />
                    <span className="text-[10px] text-gray-400 normal-case">
                      Flexural (MPa)
                    </span>
                  </th>
                  <th className="text-center px-4 py-3">
                    C3
                    <br />
                    <span className="text-[10px] text-gray-400 normal-case">
                      Lead Time
                    </span>
                  </th>
                  <th className="text-center px-4 py-3">
                    C4
                    <br />
                    <span className="text-[10px] text-gray-400 normal-case">
                      Usia Vendor
                    </span>
                  </th>
                  <th className="text-center px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <DollarSign
                        size={40}
                        className="mx-auto mb-2 opacity-30"
                      />
                      Belum ada data harga vendor
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.vendor_name}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs">{p.nama_barang}</p>
                        <p className="text-xs text-gray-400">{p.kode_barang}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        Rp {Number(p.price_per_unit).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <SkalaBadge val={hargaToSkala(p.price_per_unit)} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <SkalaBadge
                            val={flexuralToSkala(p.flexural_strength)}
                          />
                          <span className="text-[10px] text-gray-400">
                            {p.flexural_strength || 0} MPa
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <SkalaBadge val={leadTimeToSkala(p.lead_time_days)} />
                          <span className="text-[10px] text-gray-400">
                            {p.lead_time_days || 0} hari
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <SkalaBadge
                            val={reputasiToSkala(p.reputation_years)}
                          />
                          <span className="text-[10px] text-gray-400">
                            {p.reputation_years || 0} thn
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editItem ? "Edit Harga Vendor" : "Tambah Harga Vendor"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor *
              </label>
              <select
                className="input-field"
                required
                value={form.vendor_id}
                onChange={f("vendor_id")}
                disabled={!!editItem}
              >
                <option value="">-- Pilih Vendor --</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material *
              </label>
              <select
                className="input-field"
                required
                value={form.material_id}
                onChange={f("material_id")}
                disabled={!!editItem}
              >
                <option value="">-- Pilih Material --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.kode_barang} – {m.nama_barang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* C1 — Harga */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">
              C1 — Harga (COST, bobot 40%)
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Harga per Unit (Rp) *
                </label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  required
                  value={form.price_per_unit}
                  onChange={f("price_per_unit")}
                  placeholder="460000"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Sumber: situs resmi vendor / marketplace Shopee
                </p>
              </div>
              {previewSkala.c1 && (
                <div className="text-center mb-1">
                  <p className="text-xs text-gray-500 mb-1">Skala</p>
                  <SkalaBadge val={previewSkala.c1} />
                  <p className="text-xs text-gray-400 mt-1">/4</p>
                </div>
              )}
            </div>
          </div>

          {/* C2 — Kualitas */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">
              C2 — Kualitas Produk / Flexural Strength (BENEFIT, bobot 30%)
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Flexural Strength (MPa)
                </label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  value={form.flexural_strength}
                  onChange={f("flexural_strength")}
                  placeholder="1200"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Sumber: datasheet produk / situs resmi vendor (ISO 6872)
                </p>
              </div>
              {previewSkala.c2 && (
                <div className="text-center mb-1">
                  <p className="text-xs text-gray-500 mb-1">Skala</p>
                  <SkalaBadge val={previewSkala.c2} />
                  <p className="text-xs text-gray-400 mt-1">/4</p>
                </div>
              )}
            </div>
          </div>

          {/* C3 — Lead Time */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">
              C3 — Lead Time (BENEFIT, bobot 20%)
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Estimasi Pengiriman (hari)
                </label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  value={form.lead_time_days}
                  onChange={f("lead_time_days")}
                  placeholder="5"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Sumber: situs resmi / toko resmi di Shopee
                </p>
              </div>
              {previewSkala.c3 && (
                <div className="text-center mb-1">
                  <p className="text-xs text-gray-500 mb-1">Skala</p>
                  <SkalaBadge val={previewSkala.c3} />
                  <p className="text-xs text-gray-400 mt-1">/4</p>
                </div>
              )}
            </div>
          </div>

          {/* C4 — Reputasi */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-700 mb-2">
              C4 — Reputasi Vendor / Usia Perusahaan (BENEFIT, bobot 10%)
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Usia Perusahaan / Brand (tahun)
                </label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  value={form.reputation_years}
                  onChange={f("reputation_years")}
                  placeholder="8"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Sumber: halaman "About Us" situs resmi vendor
                </p>
              </div>
              {previewSkala.c4 && (
                <div className="text-center mb-1">
                  <p className="text-xs text-gray-500 mb-1">Skala</p>
                  <SkalaBadge val={previewSkala.c4} />
                  <p className="text-xs text-gray-400 mt-1">/4</p>
                </div>
              )}
            </div>
          </div>

          {/* Info tambahan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sertifikasi (opsional — tidak dipakai TOPSIS)
            </label>
            <input
              className="input-field"
              value={form.certifications}
              onChange={f("certifications")}
              placeholder="ISO13485, FDA, CE"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving
                ? "Menyimpan..."
                : editItem
                ? "Simpan Perubahan"
                : "Tambah Data"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
