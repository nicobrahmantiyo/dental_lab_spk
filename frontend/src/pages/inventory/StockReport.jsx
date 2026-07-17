// frontend/src/pages/inventory/StockReport.jsx
import { useState, useEffect } from "react";
import { Download, Printer } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { fmtQty } from "../../utils/format";

export default function StockReport() {
  const { user, isRole } = useAuth();
  const canExport = isRole("admin"); // hanya Admin Inventori yang boleh export/cetak laporan

  const [summary, setSummary] = useState([]);
  const [transactions, setTxns] = useState([]);
  const [tab, setTab] = useState("summary");
  const [filters, setFilters] = useState({ type: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/stocks/summary")
      .then((r) => setSummary(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "transactions") {
      setLoading(true);
      api
        .get("/stocks/transactions", { params: filters })
        .then((r) => setTxns(r.data.data))
        .finally(() => setLoading(false));
    }
  }, [tab, filters]);

  const f = (p) => (e) =>
    setFilters((prev) => ({ ...prev, [p]: e.target.value }));

  const todayLabel = new Date().toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

  // ---------- Export ke CSV (dibuka langsung di Excel/Sheets, tanpa library eksternal) ----------
  const exportExcel = () => {
    let rows, fileTag;

    if (tab === "summary") {
      rows = summary.map((m) => ({
        "Kode Barang": m.kode_barang,
        "Nama Barang": m.nama_barang,
        Brand: m.brand_name || "-",
        Kategori: m.category_name || "-",
        "Stok Saat Ini": fmtQty(m.current_stock),
        Satuan: m.unit,
        "Min Stok": fmtQty(m.min_stock),
        Status:
          m.stock_status === "OUT"
            ? "Habis"
            : m.stock_status === "LOW"
            ? "Menipis"
            : "Normal",
      }));
      fileTag = "ringkasan-stok";
    } else {
      rows = transactions.map((t) => ({
        Tanggal: new Date(t.transaction_date).toLocaleString("id-ID"),
        Kode: t.kode_barang,
        Material: t.nama_barang,
        Tipe: t.transaction_type === "IN" ? "Masuk" : "Keluar",
        Jumlah: fmtQty(t.quantity),
        Satuan: t.unit,
        Oleh: t.user_name,
        Keterangan: t.note || "-",
      }));
      fileTag = "riwayat-transaksi";
    }

    if (!rows.length) return;

    const escapeCsv = (val) => {
      const s = String(val ?? "");
      // bungkus dengan tanda kutip kalau mengandung koma, kutip, atau baris baru
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
    ];
    // tambahkan BOM supaya karakter & format angka terbaca benar saat dibuka di Excel
    const csvContent = "\uFEFF" + csvLines.join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);

    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-${fileTag}-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------- Cetak / Simpan PDF (lewat dialog print browser) ----------
  const printReport = () => window.print();

  return (
    <div>
      {/* Kop laporan — hanya muncul saat dicetak/PDF */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">Laporan Stok — Dental Lab SPK</h1>
        <p className="text-xs text-gray-600">
          {tab === "summary" ? "Ringkasan Stok" : "Riwayat Transaksi"} ·
          Dicetak: {todayLabel} · Oleh: {user?.full_name || "-"}
        </p>
        <hr className="my-2" />
      </div>

      <div className="mb-6 flex items-start justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Stok</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan dan riwayat transaksi
          </p>
        </div>

        {canExport && (
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                         bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              title="Export data yang sedang ditampilkan ke CSV (bisa dibuka di Excel)"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                         bg-blue-600 text-white hover:bg-blue-700"
              title="Cetak / simpan sebagai PDF"
            >
              <Printer size={16} /> Cetak / PDF
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4 print:hidden">
        {["summary", "transactions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
          >
            {t === "summary" ? "Ringkasan Stok" : "Riwayat Transaksi"}
          </button>
        ))}
      </div>

      {tab === "summary" ? (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left px-4 py-3 font-medium">Kode</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Nama Barang
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Brand</th>
                  <th className="text-right px-4 py-3 font-medium">
                    Stok Saat Ini
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Min Stok</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {m.kode_barang}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-xs">
                      <p className="truncate">{m.nama_barang}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {m.brand_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span
                        className={
                          m.stock_status !== "OK"
                            ? "text-red-600"
                            : "text-gray-900"
                        }
                      >
                        {fmtQty(m.current_stock)}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">
                        {m.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {fmtQty(m.min_stock)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.stock_status === "OUT" ? (
                        <span className="badge-out">Habis</span>
                      ) : m.stock_status === "LOW" ? (
                        <span className="badge-low">Menipis</span>
                      ) : (
                        <span className="badge-ok">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="card mb-4 p-4 grid grid-cols-3 gap-3 print:hidden">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipe</label>
              <select
                className="input-field"
                value={filters.type}
                onChange={f("type")}
              >
                <option value="">Semua</option>
                <option value="IN">Masuk</option>
                <option value="OUT">Keluar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                className="input-field"
                value={filters.from}
                onChange={f("from")}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                className="input-field"
                value={filters.to}
                onChange={f("to")}
              />
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-12 print:hidden">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="text-left px-4 py-3 font-medium">
                        Tanggal
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Material
                      </th>
                      <th className="text-center px-4 py-3 font-medium">
                        Tipe
                      </th>
                      <th className="text-right px-4 py-3 font-medium">
                        Jumlah
                      </th>
                      <th className="text-left px-4 py-3 font-medium">Oleh</th>
                      <th className="text-left px-4 py-3 font-medium">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-12 text-gray-400"
                        >
                          Tidak ada transaksi
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {new Date(t.transaction_date).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-xs">
                              {t.nama_barang}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t.kode_barang}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {t.transaction_type === "IN" ? (
                              <span className="badge-ok">Masuk</span>
                            ) : (
                              <span className="badge-out">Keluar</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {t.transaction_type === "IN" ? "+" : "-"}
                            {fmtQty(t.quantity)} {t.unit}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {t.user_name}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {t.note || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Aturan tampilan khusus saat dialog print/PDF browser aktif */}
      <style>{`
        @media print {
          nav, aside, header, .sidebar, .app-navbar { display: none !important; }
          body { background: white !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
}
