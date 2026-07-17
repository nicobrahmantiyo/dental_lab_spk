// frontend/src/pages/inventory/HandoverList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { FileText, Printer } from "lucide-react";
import { fmtQty } from "../../utils/format";

export default function HandoverList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: "", to: "" });

  const f = (p) => (e) =>
    setFilters((prev) => ({ ...prev, [p]: e.target.value }));

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/stocks/handover", {
        params: filters,
      });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <FileText className="text-blue-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Surat Serah Terima
          </h1>
          <p className="text-sm text-gray-500">
            Dokumen stok keluar hasil verifikasi pemakaian
          </p>
        </div>
      </div>

      <div className="card mb-4 p-4 grid grid-cols-2 gap-3 max-w-md">
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
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left px-4 py-3 font-medium">
                    No. Dokumen
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium">
                    Diserahkan Kepada
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Penerima</th>
                  <th className="text-right px-4 py-3 font-medium">
                    Jumlah Item
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    Dibuat Oleh
                  </th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <FileText size={40} className="mx-auto mb-2 opacity-30" />
                      Belum ada Surat Serah Terima
                    </td>
                  </tr>
                ) : (
                  data.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-xs">
                        {d.doc_number}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(d.doc_date).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {d.to_location}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {d.received_by_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {fmtQty(d.total_item)} item
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {d.created_by_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/handover/${d.id}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          <Printer size={14} /> Cetak
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
