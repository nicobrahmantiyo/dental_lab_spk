// frontend/src/pages/technician/UsageList.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { FlaskConical, CheckCircle2, XCircle, Truck } from "lucide-react";
import { fmtQty } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/ui/Modal";

const STATUS_BADGE = {
  PENDING: "bg-yellow-100 text-yellow-700",
  VERIFIED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};
const STATUS_LABEL = {
  PENDING: "Menunggu Verifikasi",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

export default function UsageList() {
  const { isRole } = useAuth();
  const isAdmin = isRole("admin");
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    usage_month: "",
    status: "",
  });
  const [selected, setSelected] = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [handoverModal, setHandoverModal] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    to_location: "Klinik",
    received_by_name: "",
    notes: "",
  });
  const [processing, setProcessing] = useState(false);

  const f = (p) => (e) =>
    setFilters((prev) => ({ ...prev, [p]: e.target.value }));

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/usage", { params: filters });
      setData(res.data);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters]);

  const handleVerify = async (id, status, reject_reason) => {
    try {
      await api.patch(`/usage/${id}/verify`, { status, reject_reason });
      toast.success(
        status === "VERIFIED" ? "Pemakaian diverifikasi" : "Pemakaian ditolak"
      );
      load();
    } catch {}
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    await handleVerify(rejectTarget, "REJECTED", rejectReason);
    setRejectTarget(null);
    setRejectReason("");
  };

  const selectableIds = data
    .filter((d) => d.verification_status === "VERIFIED" && !d.stock_out_tx_id)
    .map((d) => d.id);

  const toggleAll = () => {
    setSelected(selected.length === selectableIds.length ? [] : selectableIds);
  };
  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submitHandover = async (e) => {
    e.preventDefault();
    if (selected.length === 0)
      return toast.error("Pilih minimal satu data pemakaian");
    setProcessing(true);
    try {
      const { data: res } = await api.post("/stocks/out-from-usage", {
        usage_ids: selected,
        ...handoverForm,
      });
      toast.success(res.message);
      setHandoverModal(false);
      setHandoverForm({
        to_location: "Klinik",
        received_by_name: "",
        notes: "",
      });
      navigate(`/handover/${res.data.handover_id}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Riwayat Pemakaian
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? "Verifikasi pemakaian teknisi, lalu proses menjadi Stok Keluar & Surat Serah Terima"
              : "Data pemakaian material per pasien"}
          </p>
        </div>
        {isAdmin && selected.length > 0 && (
          <button
            onClick={() => setHandoverModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Truck size={16} /> Buat Stok Keluar ({selected.length})
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-4 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Bulan Pemakaian
          </label>
          <div className="relative">
            <input
              type="month"
              className="input-field"
              value={filters.usage_month}
              onChange={f("usage_month")}
            />
            {!filters.usage_month && (
              <span className="absolute inset-y-0 left-3 right-9 flex items-center text-sm text-gray-400 pointer-events-none bg-white rounded-l-lg">
                Pilih bulan
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Status Verifikasi
            </label>
            <select
              className="input-field"
              value={filters.status}
              onChange={f("status")}
            >
              <option value="">Semua</option>
              <option value="PENDING">Menunggu Verifikasi</option>
              <option value="VERIFIED">Terverifikasi</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        )}
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
                <tr className="text-xs text-gray-500 uppercase">
                  {isAdmin && (
                    <th className="text-left px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={
                          selectableIds.length > 0 &&
                          selected.length === selectableIds.length
                        }
                        onChange={toggleAll}
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium">Material</th>
                  <th className="text-left px-4 py-3 font-medium">Pasien</th>
                  <th className="text-left px-4 py-3 font-medium">Dokter</th>
                  <th className="text-right px-4 py-3 font-medium">
                    Qty Pakai
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Qty Return
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 font-medium">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 9 : 7}
                      className="text-center py-12 text-gray-400"
                    >
                      <FlaskConical
                        size={40}
                        className="mx-auto mb-2 opacity-30"
                      />
                      Tidak ada data pemakaian
                    </td>
                  </tr>
                ) : (
                  data.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      {isAdmin && (
                        <td className="px-4 py-3">
                          {d.verification_status === "VERIFIED" &&
                            !d.stock_out_tx_id && (
                              <input
                                type="checkbox"
                                checked={selected.includes(d.id)}
                                onChange={() => toggleOne(d.id)}
                              />
                            )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(d.usage_date).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs">{d.nama_barang}</p>
                        <p className="text-xs text-gray-400">{d.kode_barang}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {d.patient_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {d.doctor_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {fmtQty(d.qty_of_usage)} {d.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {fmtQty(d.qty_of_return || 0)} {d.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            STATUS_BADGE[d.verification_status]
                          }`}
                        >
                          {STATUS_LABEL[d.verification_status]}
                        </span>
                        {d.stock_out_tx_id && (
                          <p className="text-[10px] text-blue-600 mt-1">
                            ✓ Sudah diproses Stok Keluar
                          </p>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          {d.verification_status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                title="Verifikasi"
                                onClick={() => handleVerify(d.id, "VERIFIED")}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                title="Tolak"
                                onClick={() => setRejectTarget(d.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Tolak */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Tolak Pemakaian"
        size="sm"
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Alasan Penolakan
          </label>
          <textarea
            className="input-field"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Contoh: qty tidak sesuai"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="btn-secondary"
              onClick={() => setRejectTarget(null)}
            >
              Batal
            </button>
            <button className="btn-danger" onClick={submitReject}>
              Tolak Pemakaian
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Buat Stok Keluar / Surat Serah Terima */}
      <Modal
        open={handoverModal}
        onClose={() => setHandoverModal(false)}
        title="Buat Stok Keluar & Surat Serah Terima"
      >
        <form onSubmit={submitHandover} className="space-y-4">
          <p className="text-sm text-gray-500">
            {selected.length} data pemakaian terverifikasi akan diproses menjadi
            transaksi Stok Keluar dan Surat Serah Terima.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diserahkan Kepada (Lokasi/Klinik) *
            </label>
            <input
              className="input-field"
              required
              value={handoverForm.to_location}
              onChange={(e) =>
                setHandoverForm((p) => ({ ...p, to_location: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Penerima
            </label>
            <input
              className="input-field"
              value={handoverForm.received_by_name}
              onChange={(e) =>
                setHandoverForm((p) => ({
                  ...p,
                  received_by_name: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan
            </label>
            <textarea
              className="input-field"
              rows={2}
              value={handoverForm.notes}
              onChange={(e) =>
                setHandoverForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setHandoverModal(false)}
            >
              Batal
            </button>
            <button type="submit" disabled={processing} className="btn-primary">
              {processing ? "Memproses..." : "Proses & Buat Surat Serah Terima"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
